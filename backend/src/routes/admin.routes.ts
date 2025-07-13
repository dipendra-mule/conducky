import { Router, Request, Response } from 'express';
import { requireAuth, AuthUser } from '../middleware/auth';
import { requireSystemAdmin } from '../utils/rbac';
import { PrismaClient } from '@prisma/client';
import { reinitializeOAuthStrategies } from '../config/passport';
import logger from '../config/logger';
import { databaseMonitor } from '../services/database-monitoring.service';

// Import security middleware
import { strictRateLimit } from '../middleware/rate-limit';
import { validateEvent, handleValidationErrors } from '../middleware/validation';
import { EventService } from '../services/event.service';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

const router = Router();
const prisma = new PrismaClient();
const eventService = new EventService(prisma);

/**
 * Helper function to count event users using unified RBAC
 */
async function getEventUserCount(eventId: string): Promise<number> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      scopeType: 'event',
      scopeId: eventId
    },
    distinct: ['userId'] // Count unique users only
  });
  return userRoles.length;
}

/**
 * Helper function to get event user creation dates for activity tracking
 */
async function getEventUserDates(eventId: string): Promise<Date[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      scopeType: 'event',
      scopeId: eventId
    },
    include: {
      user: {
        select: { createdAt: true }
      }
    },
    distinct: ['userId']
  });
  return userRoles.map(ur => ur.user.createdAt);
}

/**
 * GET /api/admin/events
 * Get all events with statistics (System Admin only)
 */
router.get('/events', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all events with report counts (user counts will be calculated separately)
    const events = await prisma.event.findMany({
      include: {
        incidents: {
          select: {
            id: true,
            createdAt: true,
            state: true,
          },
        },
        _count: {
          select: {
            incidents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalUsers = await prisma.user.count();
    const totalReports = await prisma.incident.count();
    const activeEvents = events.length; // All events are active for now, will add status field later

    // Transform events data for API response with unified RBAC user counts
    const eventsData = await Promise.all(events.map(async (event) => {
      // Get user count and dates using unified RBAC
      const userCount = await getEventUserCount(event.id);
      const userDates = await getEventUserDates(event.id);
      
      // Find the most recent activity (report or user join)
      const incidentDates = event.incidents.map(r => r.createdAt);
      const allDates = [...incidentDates, ...userDates, event.createdAt];
      const lastActivity = allDates.length > 0 
        ? new Date(Math.max(...allDates.map(d => d.getTime())))
        : event.createdAt;

      return {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        status: 'active' as const, // Will implement enable/disable later
        userCount: userCount,
        reportCount: event._count.incidents,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        lastActivity: lastActivity.toISOString(),
        website: event.website,
        contactEmail: event.contactEmail,
      };
    }));

    const statistics = {
      totalEvents: events.length,
      activeEvents,
      totalUsers,
      totalReports,
    };

    res.json({
      events: eventsData,
      statistics,
    });
  } catch (error: any) {
    logger.error('Error fetching admin events:', error);
    res.status(500).json({
      error: 'Failed to fetch events',
      details: error.message,
    });
  }
});

/**
 * POST /api/admin/events
 * Create a new event (System Admin only) - simplified version for basic event creation
 */
router.post('/events', strictRateLimit, validateEvent, handleValidationErrors, requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await eventService.createEvent(req.body);

    if (result.success) {
        res.status(201).json(result.data);
    } else {
        // Use a 409 status for "slug already exists" conflicts
        if (result.error?.includes('exists')) {
            res.status(409).json({ error: result.error });
        } else {
            res.status(400).json({ error: result.error });
        }
    }
  } catch (error: any) {
    logger.error('Error creating event', {
      error: error.message,
      userId: req.user?.id,
      requestData: { name: req.body?.name, slug: req.body?.slug }
    });
    res.status(500).json({
      error: 'Failed to create event',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/events/check-slug/:slug
 * Check if a slug is available (System Admin only)
 */
router.get('/events/check-slug/:slug', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      res.status(400).json({
        error: 'Slug parameter is required',
      });
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      res.json({
        available: false,
        reason: 'Slug must contain only lowercase letters, numbers, and hyphens',
      });
      return;
    }

    if (slug.length < 3 || slug.length > 50) {
      res.json({
        available: false,
        reason: 'Slug must be 3-50 characters long',
      });
      return;
    }

    const existingEvent = await prisma.event.findUnique({
      where: { slug },
    });

    res.json({
      available: !existingEvent,
      reason: existingEvent ? 'Slug is already taken' : null,
    });
  } catch (error: any) {
    logger.error('Error checking slug availability:', error);
    res.status(500).json({
      error: 'Failed to check slug availability',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/events/stats
 * Get system-wide statistics (System Admin only)
 */
router.get('/events/stats', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalEvents,
      totalUsers,
      totalReports,
      recentActivity,
    ] = await Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.incident.count(),
      prisma.incident.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: { name: true, slug: true },
          },
        },
      }),
    ]);

    // Calculate reports by state
    const reportsByState = await prisma.incident.groupBy({
      by: ['state'],
      _count: {
        state: true,
      },
    });

    const stateStats = reportsByState.reduce((acc, item) => {
      acc[item.state] = item._count.state;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalEvents,
      activeEvents: totalEvents, // Will implement enable/disable later
      totalUsers,
      totalReports,
      reportsByState: stateStats,
      recentActivity: recentActivity.map(incident => ({
        id: incident.id,
        title: incident.title,
        state: incident.state,
        eventName: incident.event.name,
        eventSlug: incident.event.slug,
        createdAt: incident.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching system stats:', error);
    res.status(500).json({
      error: 'Failed to fetch system statistics',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/system/settings
 * Get all system settings (System Admin only)
 */
router.get('/system/settings', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all system settings from database
    const settings = await prisma.systemSetting.findMany();
    
    // Convert array to object for easier frontend usage
    const settingsObj: Record<string, any> = {};
    settings.forEach(setting => {
      // Special handling for email settings - parse JSON
      if (setting.key === 'email') {
        try {
          settingsObj[setting.key] = JSON.parse(setting.value);
        } catch (parseError) {
          logger.error('Error parsing email settings:', parseError);
          settingsObj[setting.key] = null;
        }
      } else if (setting.key === 'googleOAuth') {
        try {
          settingsObj[setting.key] = JSON.parse(setting.value);
        } catch (parseError) {
          logger.error('Error parsing Google OAuth settings:', parseError);
          settingsObj[setting.key] = null;
        }
      } else if (setting.key === 'githubOAuth') {
        try {
          settingsObj[setting.key] = JSON.parse(setting.value);
        } catch (parseError) {
          logger.error('Error parsing GitHub OAuth settings:', parseError);
          settingsObj[setting.key] = null;
        }
      } else {
        settingsObj[setting.key] = setting.value;
      }
    });
    
    res.json({ settings: settingsObj });
  } catch (err: any) {
    logger.error('Error fetching admin system settings:', err);
    res.status(500).json({ 
      error: 'Failed to fetch system settings',
      ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    });
  }
});

/**
 * PATCH /api/admin/system/settings
 * Update system settings (System Admin only)
 */
router.patch('/system/settings', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      res.status(400).json({
        error: 'Updates object is required',
      });
      return;
    }

    const results = [];

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'string') {
        res.status(400).json({
          error: `Setting value for '${key}' must be a string`,
        });
        return;
      }

      const setting = await prisma.systemSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });

      results.push(setting);
    }

    res.json({
      message: 'System settings updated successfully',
      updated: results.map(setting => ({
        key: setting.key,
        value: setting.value,
      })),
    });

    // Reinitialize OAuth strategies
    await reinitializeOAuthStrategies();
  } catch (error: any) {
    logger.error('Error updating system settings:', error);
    res.status(500).json({
      error: 'Failed to update system settings',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

/**
 * PATCH /api/admin/events/:eventId/toggle
 * Toggle event active status (System Admin only)
 */
router.patch('/events/:eventId/toggle', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled field must be a boolean' });
      return;
    }

    // Update the event's active status
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: { isActive: enabled },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      message: `Event ${enabled ? 'enabled' : 'disabled'} successfully`,
      event: updatedEvent,
    });
  } catch (error) {
    logger.error('Error toggling event status:', error);
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to toggle event status' });
  }
});

/**
 * GET /api/admin/events/:eventId
 * Get individual event details (System Admin only)
 */
router.get('/events/:eventId', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            incidents: true,
          },
        },
      },
    });

    if (!event) {
      res.status(404).json({
        error: 'Event not found',
      });
      return;
    }

    // Get user count using unified RBAC
    const userCount = await getEventUserCount(eventId);

    res.json({
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        isActive: event.isActive,
        website: event.website,
        contactEmail: event.contactEmail,
        startDate: event.startDate?.toISOString(),
        endDate: event.endDate?.toISOString(),
        codeOfConduct: event.codeOfConduct,
        setupComplete: event.isActive, // For now, isActive indicates setup completion
        userCount: userCount,
        reportCount: event._count.incidents,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching event:', error);
    res.status(500).json({
      error: 'Failed to fetch event',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/events/:eventId/invites
 * Get event invite links (System Admin only)
 */
router.get('/events/:eventId/invites', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      res.status(404).json({
        error: 'Event not found',
      });
      return;
    }

    const invites = await prisma.eventInviteLink.findMany({
      where: { eventId },
      include: {
        role: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      invites: invites.map(invite => ({
        id: invite.id,
        code: invite.code,
        email: invite.note || 'Not specified', // Use note field for email or description
        role: invite.role.name,
        status: invite.useCount > 0 ? 'Used' : invite.disabled ? 'Disabled' : 'Pending',
        createdAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString() || null,
        useCount: invite.useCount,
        maxUses: invite.maxUses,
      })),
    });
  } catch (error: any) {
    logger.error('Error fetching event invites:', error);
    res.status(500).json({
      error: 'Failed to fetch event invites',
      details: error.message,
    });
  }
});

/**
 * POST /api/admin/events/:eventId/invites
 * Create event invite link (System Admin only)
 */
router.post('/events/:eventId/invites', requireSystemAdmin(), async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { email, role } = req.body;

    // Get current user ID for createdByUserId
    const currentUser = (req as any).user;
    if (!currentUser) {
      res.status(401).json({
        error: 'Authentication required',
      });
      return;
    }

    // Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: 'Valid email is required',
      });
      return;
    }

    // Map legacy role names to unified role names
    const roleMapping: { [key: string]: string } = {
      'Admin': 'event_admin',
      'Responder': 'responder',
      'Reporter': 'reporter'
    };

    if (!role || !['Admin', 'Responder', 'Reporter'].includes(role)) {
      res.status(400).json({
        error: 'Role must be Admin, Responder, or Reporter',
      });
      return;
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      res.status(404).json({
        error: 'Event not found',
      });
      return;
    }

    // Get unified role name
    const unifiedRoleName = roleMapping[role];
    
    // Find the unified role
    const roleRecord = await prisma.unifiedRole.findUnique({
      where: { name: unifiedRoleName },
    });

    if (!roleRecord) {
      res.status(400).json({
        error: 'Invalid role',
      });
      return;
    }

    // Generate cryptographically secure invite code
    const crypto = require('crypto');
    const code = crypto.randomBytes(16).toString('hex');

    // Create invite link (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.eventInviteLink.create({
      data: {
        code,
        eventId,
        roleId: roleRecord.id,
        createdByUserId: currentUser.id,
        expiresAt,
        note: `Invite for ${email} as ${role}`, // Store email in note field
        maxUses: 1, // Single use invite
      },
      include: {
        role: {
          select: { name: true },
        },
      },
    });

    res.status(201).json({
      message: 'Invite created successfully',
      invite: {
        id: invite.id,
        code: invite.code,
        email: email,
        role: invite.role.name,
        status: 'Pending',
        createdAt: invite.createdAt.toISOString(),
        expiresAt: invite.expiresAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    logger.error('Error creating event invite:', error);
    res.status(500).json({
      error: 'Failed to create event invite',
      details: error.message,
    });
  }
});

// Add email configuration routes
router.get('/settings/email', requireSystemAdmin(), async (req: Request, res: Response) => {
  try {
    // Fetch email settings from database
    const emailSetting = await prisma.systemSetting.findUnique({
      where: { key: 'email' }
    });

    let emailSettings = {
      provider: 'console',
      fromAddress: '',
      fromName: '',
      replyTo: '',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      smtpTls: false,
      sendgridApiKey: ''
    };

    // If settings exist in database, parse and use them
    if (emailSetting?.value) {
      try {
        const savedSettings = JSON.parse(emailSetting.value);
        emailSettings = { ...emailSettings, ...savedSettings };
      } catch (parseError) {
        logger.error('Error parsing saved email settings:', parseError);
        // Fall back to defaults if parsing fails
      }
    }

    res.json({
      email: emailSettings
    });
  } catch (error) {
    logger.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Failed to fetch email settings.' });
  }
});

router.put('/settings/email', requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      provider,
      fromAddress,
      fromName,
      replyTo,
      smtpHost, 
      smtpPort, 
      smtpUsername, 
      smtpPassword, 
      smtpSecure, 
      smtpTls,
      sendgridApiKey
    } = req.body;

    logger.debug('PUT /settings/email REQUEST', { 
      userId: req.user?.id,
      provider,
      fromAddress,
      hasFromName: !!fromName
    });

    logger.debug('Extracted email settings values', { provider, fromAddress, fromName });

    // Validate required fields based on provider
    if (!provider) {
      logger.warn('Email settings validation failed: No provider provided', { userId: req.user?.id });
      return res.status(400).json({ 
        error: 'Email provider is required.' 
      });
    }

    if (!fromAddress) {
      logger.warn('Email settings validation failed: No fromAddress provided', { userId: req.user?.id });
      return res.status(400).json({ 
        error: 'From address is required.' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromAddress)) {
      logger.warn('Email settings validation failed: Invalid email format', { 
        userId: req.user?.id,
        fromAddress 
      });
      return res.status(400).json({ 
        error: 'From address must be a valid email address.' 
      });
    }

    // Save email settings to database
    const emailSettings = {
      provider,
      fromAddress,
      fromName,
      replyTo,
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      smtpUsername,
      smtpPassword,
      smtpSecure: Boolean(smtpSecure),
      smtpTls: Boolean(smtpTls),
      sendgridApiKey
    };

    // Upsert the email settings in the SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: 'email' },
      update: { 
        value: JSON.stringify(emailSettings)
      },
      create: { 
        key: 'email',
        value: JSON.stringify(emailSettings)
      }
    });

    logger.info('Email settings saved to database successfully', { 
      userId: req.user?.id,
      provider 
    });

    res.json({ 
      message: 'Email settings saved successfully' 
    });
  } catch (error) {
    logger.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings.' });
  }
});

router.post('/settings/email/test', requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      provider,
      fromAddress,
      fromName,
      replyTo,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
      smtpTls,
      sendgridApiKey
    } = req.body;

    // Validate required fields
    if (!provider) {
      return res.status(400).json({ 
        error: 'Email provider is required.' 
      });
    }

    if (!fromAddress) {
      return res.status(400).json({ 
        error: 'From address is required.' 
      });
    }

    // Get current user for test email recipient
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's email from database
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { email: true, name: true }
    });

    if (!user?.email) {
      return res.status(400).json({ 
        error: 'Unable to determine your email address for testing. Please ensure your profile has a valid email.' 
      });
    }

    logger.debug(`\n=== EMAIL TEST (${provider.toUpperCase()} Provider) ===`);
    logger.debug(`Testing email settings for user: ${user.email}`);
    logger.debug(`From: ${fromAddress}`);
    logger.debug(`From Name: ${fromName || 'Not set'}`);

    // Import EmailService here to avoid circular imports
    const { EmailService } = require('../utils/email');
    
    // Test the email configuration
    const testResult = await EmailService.testEmailSettings({
      provider,
      fromAddress,
      fromName,
      replyTo,
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      smtpSecure,
      smtpTls,
      sendgridApiKey
    }, user.email);

    logger.debug(`Test result: ${testResult.success ? 'SUCCESS' : 'FAILED'}`);
    logger.debug(`Message: ${testResult.message}`);
    if (testResult.error) {
      logger.debug(`Error: ${testResult.error}`);
    }
    logger.debug('=== END EMAIL TEST ===\n');

    if (testResult.success) {
      res.json({
        success: true,
        message: testResult.message,
        details: `Test email sent to ${user.email}`
      });
    } else {
      res.status(400).json({
        success: false,
        error: testResult.message,
        details: testResult.error
      });
    }
  } catch (error) {
    logger.error('Error testing email connection:', error);
    res.status(500).json({ 
      error: 'Failed to test email connection.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Google OAuth configuration routes
router.get('/settings/google-oauth', requireSystemAdmin(), async (req: Request, res: Response) => {
  try {
    // Fetch Google OAuth settings from database
    const googleOAuthSetting = await prisma.systemSetting.findUnique({
      where: { key: 'googleOAuth' }
    });

    let googleOAuthSettings = {
      clientId: '',
      clientSecret: '',
      enabled: false
    };

    // If settings exist in database, parse and use them
    if (googleOAuthSetting?.value) {
      try {
        const savedSettings = JSON.parse(googleOAuthSetting.value);
        googleOAuthSettings = { ...googleOAuthSettings, ...savedSettings };
      } catch (parseError) {
        logger.error('Error parsing saved Google OAuth settings:', parseError);
        // Fall back to defaults if parsing fails
      }
    }

    res.json({
      googleOAuth: googleOAuthSettings
    });
  } catch (error) {
    logger.error('Error fetching Google OAuth settings:', error);
    res.status(500).json({ error: 'Failed to fetch Google OAuth settings.' });
  }
});

router.put('/settings/google-oauth', requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      clientId,
      clientSecret,
      enabled
    } = req.body;

    // Validate required fields if enabled
    if (enabled && (!clientId || !clientSecret)) {
      return res.status(400).json({ 
        error: 'Client ID and Client Secret are required when Google OAuth is enabled.' 
      });
    }

    // Save Google OAuth settings to database
    const googleOAuthSettings = {
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      enabled: Boolean(enabled)
    };

    // Upsert the Google OAuth settings in the SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: 'googleOAuth' },
      update: { 
        value: JSON.stringify(googleOAuthSettings)
      },
      create: { 
        key: 'googleOAuth',
        value: JSON.stringify(googleOAuthSettings)
      }
    });

    logger.info('Google OAuth settings saved to database successfully');

    res.json({ 
      message: 'Google OAuth settings saved successfully' 
    });

    // Reinitialize OAuth strategies
    await reinitializeOAuthStrategies();
  } catch (error) {
    logger.error('Error updating Google OAuth settings:', error);
    res.status(500).json({ error: 'Failed to update Google OAuth settings.' });
  }
});

// GitHub OAuth configuration routes
router.get('/settings/github-oauth', requireSystemAdmin(), async (req: Request, res: Response) => {
  try {
    // Fetch GitHub OAuth settings from database
    const githubOAuthSetting = await prisma.systemSetting.findUnique({
      where: { key: 'githubOAuth' }
    });

    let githubOAuthSettings = {
      clientId: '',
      clientSecret: '',
      enabled: false
    };

    // If settings exist in database, parse and use them
    if (githubOAuthSetting?.value) {
      try {
        const savedSettings = JSON.parse(githubOAuthSetting.value);
        githubOAuthSettings = { ...githubOAuthSettings, ...savedSettings };
      } catch (parseError) {
        logger.error('Error parsing saved GitHub OAuth settings:', parseError);
        // Fall back to defaults if parsing fails
      }
    }

    res.json({
      githubOAuth: githubOAuthSettings
    });
  } catch (error) {
    logger.error('Error fetching GitHub OAuth settings:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub OAuth settings.' });
  }
});

router.put('/settings/github-oauth', requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      clientId,
      clientSecret,
      enabled
    } = req.body;

    // Validate required fields if enabled
    if (enabled && (!clientId || !clientSecret)) {
      return res.status(400).json({ 
        error: 'Client ID and Client Secret are required when GitHub OAuth is enabled.' 
      });
    }

    // Save GitHub OAuth settings to database
    const githubOAuthSettings = {
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      enabled: Boolean(enabled)
    };

    // Upsert the GitHub OAuth settings in the SystemSetting table
    await prisma.systemSetting.upsert({
      where: { key: 'githubOAuth' },
      update: { 
        value: JSON.stringify(githubOAuthSettings)
      },
      create: { 
        key: 'githubOAuth',
        value: JSON.stringify(githubOAuthSettings)
      }
    });

    logger.info('GitHub OAuth settings saved to database successfully');

    res.json({ 
      message: 'GitHub OAuth settings saved successfully' 
    });

    // Reinitialize OAuth strategies
    await reinitializeOAuthStrategies();
  } catch (error) {
    logger.error('Error updating GitHub OAuth settings:', error);
    res.status(500).json({ error: 'Failed to update GitHub OAuth settings.' });
  }
});

// Public endpoint to check OAuth provider availability (no auth required)
router.get('/oauth-providers', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['googleOAuth', 'githubOAuth']
        }
      }
    });

    const providers = {
      google: false,
      github: false
    };

    settings.forEach(setting => {
      try {
        const config = JSON.parse(setting.value);
        if (setting.key === 'googleOAuth' && config.enabled && config.clientId && config.clientSecret) {
          providers.google = true;
        } else if (setting.key === 'githubOAuth' && config.enabled && config.clientId && config.clientSecret) {
          providers.github = true;
        }
      } catch (parseError) {
        logger.error(`Error parsing ${setting.key} settings:`, parseError);
      }
    });

    res.json({ providers });
  } catch (error) {
    logger.error('Error checking OAuth providers:', error);
    res.status(500).json({ error: 'Failed to check OAuth providers' });
  }
});

/**
 * GET /api/admin/database/performance
 * Get database performance metrics and analysis
 */
router.get('/database/performance', requireAuth, requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const report = databaseMonitor.generateReport();
    
    logger.info('Database performance report requested', {
      userId: req.user.id,
      email: req.user.email,
      metricsCount: (report as any).summary?.totalQueries || 0
    });

    res.json({
      success: true,
      data: report,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to generate database performance report:', error);
    res.status(500).json({ 
      message: 'Failed to generate performance report',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * POST /api/admin/database/performance/reset
 * Reset database performance metrics
 */
router.post('/database/performance/reset', requireAuth, requireSystemAdmin(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    databaseMonitor.resetMetrics();
    
    logger.info('Database performance metrics reset', {
      userId: req.user.id,
      email: req.user.email
    });

    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
      resetAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to reset database performance metrics:', error);
    res.status(500).json({ 
      message: 'Failed to reset performance metrics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;