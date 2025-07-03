/**
 * Notification Utilities
 * 
 * This module handles notification creation and management
 */

import { prisma } from '../config/database';
import { UnifiedRBACService } from '../services/unified-rbac.service';
import { getUserNotificationSettings } from '../services/user-notification-settings.service';
import { emailService } from './email';

/**
 * Create a notification for a user
 */
// Define notification types for better type safety
type ReportNotificationType = 'incident_submitted' | 'incident_assigned' | 'incident_status_changed' | 'incident_comment_added';
type SystemNotificationType = 'event_invitation' | 'event_role_changed' | 'system_announcement';
type NotificationType = ReportNotificationType | SystemNotificationType;

export async function createNotification({
  userId,
  type,
  priority = 'normal',
  title,
  message,
  eventId = null,
  incidentId = null,
  actionData = null,
  actionUrl = null
}: {
  userId: string;
  type: NotificationType;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  eventId?: string | null;
  incidentId?: string | null;
  actionData?: any;
  actionUrl?: string | null;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        priority,
        title,
        message,
        eventId,
        incidentId,
        actionData,
        actionUrl,
      },
    });

    // Check user notification settings for email delivery
    const settings = await getUserNotificationSettings(userId);
    let shouldSendEmail = false;
    // Type-safe mapping for settings key
    const emailTypeMap: Record<string, keyof typeof settings> = {
      incident_submitted: 'incidentSubmittedEmail',
      incident_assigned: 'incidentAssignedEmail',
      incident_status_changed: 'incidentStatusChangedEmail',
      incident_comment_added: 'incidentCommentAddedEmail',
      event_invitation: 'eventInvitationEmail',
      event_role_changed: 'eventRoleChangedEmail',
      system_announcement: 'systemAnnouncementEmail',
    };
    const emailTypeKey = emailTypeMap[type];
    if (emailTypeKey && settings[emailTypeKey]) {
      // Fetch user email (assume userId is valid)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        try {
          await emailService.sendNotificationEmail({
            to: user.email,
            name: user.name || user.email,
            subject: title,
            message,
            actionUrl: actionUrl || undefined,
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Continue with notification creation even if email fails
        }
      }
    }
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Notify users about incident events
 */
export async function notifyReportEvent(incidentId: string, type: string, excludeUserId: string | null = null) {
  try {
    // Get the incident with event and reporter info
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        event: true,
        reporter: true,
      },
    });

    if (!incident) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Incident not found for notification:', incidentId);
      }
      return;
    }

    // Get all users with responder or event_admin roles for this event using unified RBAC
    // Query the userRole table directly for this event with the specific roles
    const eventUserRoles = await prisma.userRole.findMany({
      where: {
        scopeType: 'event',
        scopeId: incident.eventId,
        role: {
          name: {
            in: ['responder', 'event_admin'],
          },
        },
      },
      include: {
        user: true,
        role: true,
      },
    });
    
    // Transform to match expected structure for backward compatibility
    const eventUsers = eventUserRoles.map((userRole: any) => ({
      userId: userRole.userId,
      user: userRole.user,
      role: userRole.role
    }));

    // Create notifications for each relevant user
    const notifications = eventUsers
      .filter(userRole => userRole.userId !== excludeUserId)
      .map(userRole => {
        let title = '';
        let message = '';
        let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

        switch (type) {
          case 'incident_submitted':
          case 'submitted': // backward compatibility
            title = 'New Incident Submitted';
            message = `A new incident has been submitted for ${incident.event.name}`;
            priority = 'high';
            break;
          case 'incident_assigned':
          case 'assigned': // backward compatibility
            title = 'Incident Assigned';
            message = `Incident #${incident.id.substring(0, 8)} has been assigned`;
            priority = 'normal';
            break;
          case 'incident_status_changed':
          case 'status_changed': // backward compatibility
            title = 'Incident Status Updated';
            message = `Incident #${incident.id.substring(0, 8)} status has been updated`;
            priority = 'normal';
            break;
          case 'incident_comment_added':
          case 'comment_added': // backward compatibility
            title = 'New Comment Added';
            message = `A new comment has been added to incident #${incident.id.substring(0, 8)}`;
            priority = 'normal';
            break;
          default:
            title = 'Incident Update';
            message = `Incident #${incident.id.substring(0, 8)} has been updated`;
            priority = 'normal';
        }

        const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
        const actionUrl = `${frontendBaseUrl}/events/${incident.event.slug}/incidents/${incident.id}`;
        
        // Map notification types with fallback error handling
        const getNotificationType = (inputType: string): ReportNotificationType => {
          const typeMap: Record<string, ReportNotificationType> = {
            'incident_submitted': 'incident_submitted', 
            'submitted': 'incident_submitted',
            'incident_assigned': 'incident_assigned', 
            'assigned': 'incident_assigned',
            'incident_status_changed': 'incident_status_changed', 
            'status_changed': 'incident_status_changed',
            'incident_comment_added': 'incident_comment_added', 
            'comment_added': 'incident_comment_added'
          };
          
          if (!(inputType in typeMap)) {
            console.warn(`Unknown notification type: ${inputType}, falling back to 'incident_submitted'`);
            return 'incident_submitted';
          }
          return typeMap[inputType];
        };

        return createNotification({
          userId: userRole.userId,
          type: getNotificationType(type),
          priority,
          title,
          message,
          eventId: incident.eventId,
          incidentId: incident.id,
          actionUrl,
        });
      });

    await Promise.all(notifications);
    
    // Only log in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Created ${notifications.length} notifications for incident ${incidentId}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to notify incident event:', error);
    }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return result;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string) {
  try {
    const [total, unread, urgent] = await Promise.all([
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.notification.count({
        where: { userId, isRead: false, priority: 'urgent' },
      }),
    ]);

    return { total, unread, urgent };
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    throw error;
  }
}