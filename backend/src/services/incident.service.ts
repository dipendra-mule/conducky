import { PrismaClient } from '@prisma/client';
import { ServiceResult } from '../types';
import { UnifiedRBACService } from './unified-rbac.service';
import { logAudit } from '../utils/audit';

export interface IncidentCreateData {
  eventId: string;
  reporterId?: string | null;
  type: string;
  title: string;
  description: string;
  incidentAt?: Date | null;
  parties?: string | null;
  location?: string | null;
  contactPreference?: string;
  urgency?: string;
}

export interface IncidentUpdateData {
  assignedResponderId?: string | null;
  severity?: string | null;
  resolution?: string | null;
  state?: string;
  title?: string;
}

export interface IncidentQuery {
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  severity?: string;
  event?: string;
  assigned?: string;
  sort?: string;
  order?: string;
  incidentIds?: string[];
}

export interface EvidenceFile {
  filename: string;
  mimetype: string;
  size: number;
  data: Buffer;
  uploaderId?: string | null;
}

export interface IncidentWithDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  state: string;
  severity?: string | null;
  resolution?: string | null;
  incidentAt?: Date | null;
  parties?: string | null;
  location?: string | null;
  contactPreference?: string;
  createdAt: Date;
  updatedAt: Date;
  eventId: string;
  reporterId?: string | null;
  assignedResponderId?: string | null;
  reporter?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  assignedResponder?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  evidenceFiles?: Array<{
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    createdAt: Date;
    uploader?: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
  event?: {
    id: string;
    name: string;
    slug: string;
  };
  userRoles?: string[];
  _count?: {
    comments: number;
  };
}

export interface UserIncidentsResponse {
  incidents: IncidentWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class IncidentService {
  private unifiedRBAC: UnifiedRBACService;

  constructor(private prisma: PrismaClient) {
    this.unifiedRBAC = new UnifiedRBACService(prisma);
  }

  /**
   * Helper method to check if user can edit a report
   */
  private async canUserEditIncident(userId: string, eventId: string, isReporter: boolean, requiredRoles: string[] = ['responder', 'event_admin', 'system_admin']): Promise<boolean> {
    if (isReporter) {
      return true;
    }
    
    return await this.unifiedRBAC.hasEventRole(userId, eventId, requiredRoles);
  }

  /**
   * Create a new incident with optional evidence files
   */
  async createIncident(data: IncidentCreateData, evidenceFiles?: EvidenceFile[]): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Validate required fields
      if (!data.eventId || !data.type || !data.description || !data.title) {
        return {
          success: false,
          error: 'Missing required fields: eventId, type, description, title'
        };
      }

      // Validate report type
      const validTypes = ['harassment', 'safety', 'other'];
      if (!validTypes.includes(data.type)) {
        return {
          success: false,
          error: 'Invalid report type. Must be: harassment, safety, or other.'
        };
      }

      // Validate contact preference if provided
      if (data.contactPreference) {
        const validPreferences = ['email', 'phone', 'in_person', 'no_contact'];
        if (!validPreferences.includes(data.contactPreference)) {
          return {
            success: false,
            error: 'Invalid contact preference. Must be: email, phone, in_person, or no_contact.'
          };
        }
      }

      // Validate urgency/severity if provided
      if (data.urgency) {
        const validUrgencies = ['low', 'medium', 'high', 'critical'];
        if (!validUrgencies.includes(data.urgency)) {
          return {
            success: false,
            error: 'Invalid urgency level. Must be: low, medium, high, or critical.'
          };
        }
      }

      // Validate incident date if provided - prevent future dates
      if (data.incidentAt) {
        const incidentDate = new Date(data.incidentAt);
        if (isNaN(incidentDate.getTime())) {
          return {
            success: false,
            error: 'Invalid incident date format.'
          };
        }

        // Check if date is not too far in the future
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        if (incidentDate > maxFutureDate) {
          return {
            success: false,
            error: 'Incident date cannot be more than 24 hours in the future.'
          };
        }
      }

      const { eventId, reporterId, type, title, description, incidentAt, parties, location, contactPreference, urgency } = data;

      if (typeof title !== 'string' || title.length < 10 || title.length > 70) {
        return {
          success: false,
          error: 'title must be 10-70 characters.'
        };
      }

      // Check event exists
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        return {
          success: false,
          error: 'Event not found.'
        };
      }

      // Create incident first
      const incidentData: any = {
        eventId,
        reporterId,
        type,
        title,
        description,
        state: 'submitted',
        contactPreference: contactPreference || 'email', // default to email
      };

      if (incidentAt !== undefined) incidentData.incidentAt = incidentAt;
      if (parties !== undefined) incidentData.parties = parties;
      if (location !== undefined) incidentData.location = location;
      
      // Map urgency to severity (frontend uses urgency, backend uses severity)
      if (urgency) {
        incidentData.severity = urgency;
      }

      const incident = await this.prisma.incident.create({
        data: incidentData,
      });

      // Audit log: incident created
      try {
        await logAudit({
          eventId: eventId,
          userId: reporterId,
          action: 'create_incident',
          targetType: 'incident',
          targetId: incident.id,
        });
      } catch (auditError) {
        console.error('Failed to log audit for incident creation:', auditError);
        // Don't fail the incident creation if audit logging fails
      }

      // If evidence files are provided, store in DB
      if (evidenceFiles && evidenceFiles.length > 0) {
        for (const file of evidenceFiles) {
          const evidenceFile = await this.prisma.evidenceFile.create({
            data: {
              incidentId: incident.id,
              filename: file.filename,
              mimetype: file.mimetype,
              size: file.size,
              data: file.data,
              uploaderId: file.uploaderId || null,
            },
          });

          // Audit log: evidence uploaded
          try {
            await logAudit({
              eventId: eventId,
              userId: file.uploaderId || reporterId,
              action: 'upload_evidence',
              targetType: 'evidence',
              targetId: evidenceFile.id,
            });
          } catch (auditError) {
            console.error('Failed to log audit for evidence upload:', auditError);
            // Don't fail the process if audit logging fails
          }
        }
      }

      return {
        success: true,
        data: { incident }
      };
    } catch (error: any) {
      console.error('Error creating incident:', error);
      return {
        success: false,
        error: 'Failed to submit incident.'
      };
    }
  }

  /**
   * List reports for an event
   */
  async getIncidentsByEventId(eventId: string, query?: IncidentQuery): Promise<ServiceResult<{ incidents: IncidentWithDetails[] }>> {
    try {
      // Check if event exists first
      const event = await this.prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        return {
          success: false,
          error: 'Event not found.'
        };
      }

      const { userId, limit, page, sort, order } = query || {};

      const where: any = { eventId };
      if (userId) {
        where.reporterId = userId;
      }

      // Set up ordering
      let orderBy: any = { createdAt: 'desc' }; // default ordering
      if (sort && order) {
        const validSortFields = ['createdAt', 'updatedAt', 'title', 'state', 'severity'];
        const validOrders = ['asc', 'desc'];
        
        if (validSortFields.includes(sort) && validOrders.includes(order)) {
          orderBy = { [sort]: order };
        }
      }

      // Set up pagination
      const take = limit ? Math.min(Math.max(1, limit), 100) : undefined; // limit between 1-100
      const skip = (page && limit) ? (page - 1) * limit : undefined;

      const incidents = await this.prisma.incident.findMany({
        where,
        include: {
          reporter: true,
          assignedResponder: true,
          evidenceFiles: {
            include: {
              uploader: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy,
        take,
        skip,
      });

      return {
        success: true,
        data: { incidents }
      };
    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      return {
        success: false,
        error: 'Failed to fetch incidents.'
      };
    }
  }

  /**
   * List reports for an event by slug
   */
  async getIncidentsByEventSlug(slug: string, query?: IncidentQuery): Promise<ServiceResult<{ incidents: IncidentWithDetails[] }>> {
    try {
      // Get event ID from slug
      const event = await this.prisma.event.findUnique({ where: { slug } });
      if (!event) {
        return {
          success: false,
          error: 'Event not found.'
        };
      }

      return this.getIncidentsByEventId(event.id, query);
    } catch (error: any) {
      console.error('Error fetching reports by slug:', error);
      return {
        success: false,
        error: 'Failed to fetch incidents.'
      };
    }
  }

  /**
   * Get a single report by ID
   */
  async getIncidentById(incidentId: string, eventId?: string): Promise<ServiceResult<{ incident: IncidentWithDetails }>> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          reporter: true,
          assignedResponder: true,
          evidenceFiles: {
            include: {
              uploader: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (!incident) {
        return {
          success: false,
          error: 'Report not found.'
        };
      }

      if (eventId && incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      return {
        success: true,
        data: { incident }
      };
    } catch (error: any) {
      console.error('Error fetching incident:', error);
      return {
        success: false,
        error: 'Failed to fetch incident.'
      };
    }
  }

  /**
   * Get a single report by slug and report ID
   */
  async getIncidentBySlugAndId(slug: string, incidentId: string): Promise<ServiceResult<{ incident: IncidentWithDetails }>> {
    try {
      // Get event ID from slug
      const event = await this.prisma.event.findUnique({ where: { slug } });
      if (!event) {
        return {
          success: false,
          error: 'Event not found.'
        };
      }

      return this.getIncidentById(incidentId, event.id);
    } catch (error: any) {
      console.error('Error fetching report by slug:', error);
      return {
        success: false,
        error: 'Failed to fetch incident.'
      };
    }
  }

  /**
   * Update report state
   */
  async updateIncidentState(eventId: string, incidentId: string, state: string, userId?: string, notes?: string, assignedToUserId?: string): Promise<ServiceResult<{ incident: any }>> {
    
    try {
      const validStates = ['submitted', 'acknowledged', 'investigating', 'resolved', 'closed'];
      if (!state || !validStates.includes(state)) {
        return {
          success: false,
          error: 'Invalid or missing state.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          reporter: true,
          assignedResponder: true
        }
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Validate state transition requirements
      interface StateRequirement {
        requiresAssignment?: boolean;
        requiresNotes: boolean;
      }
      
      const transitionRequirements: Record<string, StateRequirement> = {
        investigating: { requiresAssignment: true, requiresNotes: true },
        resolved: { requiresNotes: true },
        closed: { requiresNotes: false }
      };

      const requirements = transitionRequirements[state];
      
      if (requirements?.requiresNotes && (!notes || !notes.trim())) {
        return {
          success: false,
          error: `State transition to ${state} requires notes explaining the action.`
        };
      }

      if (requirements?.requiresAssignment && !assignedToUserId) {
        return {
          success: false,
          error: `State transition to ${state} requires assignment to a responder.`
        };
      }

      // Verify assigned user exists and has appropriate role if assignment is required
      if (assignedToUserId) {
        const assignedUser = await this.prisma.user.findUnique({
          where: { id: assignedToUserId }
        });

        if (!assignedUser) {
          return {
            success: false,
            error: 'Assigned user not found.'
          };
        }

        // Check if user has appropriate role using unified RBAC
        const hasEventRole = await this.unifiedRBAC.hasEventRole(
          assignedToUserId, 
          eventId, 
          ['responder', 'event_admin']
        );

        if (!hasEventRole) {
          return {
            success: false,
            error: 'Assigned user must have Responder or Event Admin role for this event.'
          };
        }
      }

      const oldState = incident.state;

      // Prepare update data (Prisma type conflicts require any for now)
      const updateData: any = { state };
      if (assignedToUserId !== undefined && assignedToUserId !== null && assignedToUserId !== '') {
        updateData.assignedResponderId = assignedToUserId;
      }

      // Update state and assignment in transaction
      const updated = await this.prisma.$transaction(async (tx) => {
        // Update the report
        const updatedIncident = await tx.incident.update({
          where: { id: incidentId },
          data: updateData,
          include: {
            reporter: true,
            assignedResponder: true,
            evidenceFiles: true
          }
        });

        // Create audit log entry for state change
        if (userId) {
          await tx.auditLog.create({
            data: {
              eventId: eventId,
              userId: userId,
              action: `State changed from ${oldState} to ${state}`,
              targetType: 'Report',
              targetId: incidentId,
            }
          });

          // Create audit log for assignment if changed
          if (assignedToUserId && assignedToUserId !== incident.assignedResponderId) {
            const assignedUserName = assignedToUserId ? 
              (await tx.user.findUnique({ where: { id: assignedToUserId } }))?.name || 'Unknown' 
              : 'Unassigned';
            
            await tx.auditLog.create({
              data: {
                eventId: eventId,
                userId: userId,
                action: `Report assigned to ${assignedUserName}`,
                targetType: 'Report',
                targetId: incidentId,
              }
            });
          }
        }

        // Add a comment with the state change notes if provided
        if (notes && notes.trim() && userId) {
          await tx.incidentComment.create({
            data: {
              incidentId: incidentId,
              authorId: userId,
              body: `**State changed from ${oldState} to ${state}**\n\n${notes}`,
              isMarkdown: true,
              visibility: 'internal' // State change notes are internal by default
            }
          });
        }

        return updatedIncident;
      });

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report state:', error);
      return {
        success: false,
        error: 'Failed to update report state.'
      };
    }
  }

  /**
   * Get state history for a report
   */
  async getIncidentStateHistory(incidentId: string): Promise<ServiceResult<{ history: Array<{ id: string; fromState: string; toState: string; changedBy: string; changedAt: string; notes?: string; }> }>> {
    try {
      const auditLogs = await this.prisma.auditLog.findMany({
        where: {
          targetType: 'Report',
          targetId: incidentId,
          action: {
            contains: 'State changed'
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      const history = auditLogs.map(log => {
        // Parse the action to extract from/to states
        const match = log.action.match(/State changed from (\w+) to (\w+)/);
        const fromState = match ? match[1] : '';
        const toState = match ? match[2] : '';
        
        return {
          id: log.id,
          fromState,
          toState,
          changedBy: log.user?.name || log.user?.email || 'Unknown',
          changedAt: log.timestamp.toISOString(),
          // Note: For now, notes are stored as comments with state changes
          // We could enhance this to store notes directly in audit logs
        };
      });

      return {
        success: true,
        data: { history }
      };
    } catch (error: any) {
      console.error('Error fetching report state history:', error);
      return {
        success: false,
        error: 'Failed to fetch state history.'
      };
    }
  }

  /**
   * Update report title (with authorization check)
   */
  async updateIncidentTitle(eventId: string, incidentId: string, title: string, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      if (!title || typeof title !== 'string' || title.length < 10 || title.length > 70) {
        return {
          success: false,
          error: 'title must be 10-70 characters.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions if userId provided
      if (userId) {
        const accessCheck = await this.checkIncidentEditAccess(userId, incidentId, eventId);
        if (!accessCheck.success) {
          return {
            success: false,
            error: accessCheck.error || 'Authorization check failed.'
          };
        }
        
        if (!accessCheck.data?.canEdit) {
          return {
            success: false,
            error: accessCheck.data?.reason || 'Insufficient permissions to edit this report title.'
          };
        }
      }

      // Store original title for audit log
      const originalTitle = incident.title;

      // Update title
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { title },
        include: { reporter: true },
      });

      // Audit log: title updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: `update_incident_title`,
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for title update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report title:', error);
      return {
        success: false,
        error: 'Failed to update report title.'
      };
    }
  }

  /**
   * Update report (assignment, severity, resolution, state)
   */
  async updateIncident(slug: string, incidentId: string, updateData: IncidentUpdateData): Promise<ServiceResult<{ incident: IncidentWithDetails; originalAssignedResponderId?: string | null; originalState?: string }>> {
    try {
      // Get event ID from slug
      const event = await this.prisma.event.findUnique({ where: { slug } });
      if (!event) {
        return {
          success: false,
          error: 'Event not found.'
        };
      }

      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
      });

      if (!incident || incident.eventId !== event.id) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      const { assignedResponderId, severity, resolution, state } = updateData;

      // Build update data
      const data: any = {};
      if (assignedResponderId !== undefined) data.assignedResponderId = assignedResponderId;
      if (severity !== undefined) data.severity = severity;
      if (resolution !== undefined) data.resolution = resolution;
      if (state !== undefined) data.state = state;

      // Store original values for notification comparison
      const originalAssignedResponderId = incident.assignedResponderId;
      const originalState = incident.state;

      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data,
        include: {
          reporter: true,
          assignedResponder: true,
          evidenceFiles: {
            include: {
              uploader: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return {
        success: true,
        data: { 
          incident: updated, 
          originalAssignedResponderId, 
          originalState 
        }
      };
    } catch (error: any) {
      console.error('Error updating incident:', error);
      return {
        success: false,
        error: 'Failed to update incident.'
      };
    }
  }

  /**
   * Upload evidence files to a report
   */
  async uploadEvidenceFiles(incidentId: string, evidenceFiles: EvidenceFile[]): Promise<ServiceResult<{ files: any[] }>> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          event: true
        }
      });

      if (!incident) {
        return {
          success: false,
          error: 'Report not found.'
        };
      }

      if (!evidenceFiles || evidenceFiles.length === 0) {
        return {
          success: false,
          error: 'No files provided.'
        };
      }

      const created = [];

      for (const file of evidenceFiles) {
        const evidence = await this.prisma.evidenceFile.create({
          data: {
            incidentId: incident.id,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            data: file.data,
            uploaderId: file.uploaderId ?? null,
          },
          include: {
            uploader: { select: { id: true, name: true, email: true } },
          },
        });

        // Log evidence file upload
        await logAudit({
          action: 'evidence_file_uploaded',
          targetType: 'EvidenceFile',
          targetId: evidence.id,
          userId: file.uploaderId || undefined,
          eventId: incident.eventId
        });

        created.push({
          id: evidence.id,
          filename: evidence.filename,
          mimetype: evidence.mimetype,
          size: evidence.size,
          createdAt: evidence.createdAt,
          uploader: evidence.uploader,
        });
      }

      return {
        success: true,
        data: { files: created }
      };
    } catch (error: any) {
      console.error('Error uploading evidence files:', error);
      return {
        success: false,
        error: 'Failed to upload evidence files.'
      };
    }
  }

  /**
   * List evidence files for a report
   */
  async getEvidenceFiles(incidentId: string): Promise<ServiceResult<{ files: any[] }>> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { event: true }
      });

      if (!incident) {
        return {
          success: false,
          error: 'Report not found.'
        };
      }

      const files = await this.prisma.evidenceFile.findMany({
        where: { incidentId },
        select: {
          id: true,
          filename: true,
          mimetype: true,
          size: true,
          createdAt: true,
          uploader: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        success: true,
        data: { files }
      };
    } catch (error: any) {
      console.error('Error listing evidence files:', error);
      return {
        success: false,
        error: 'Failed to list evidence files.'
      };
    }
  }

  /**
   * Download evidence file by ID
   */
  async getEvidenceFile(evidenceId: string): Promise<ServiceResult<{ filename: string; mimetype: string; size: number; data: Buffer }>> {
    try {
      const evidence = await this.prisma.evidenceFile.findUnique({
        where: { id: evidenceId },
      });

      if (!evidence) {
        return {
          success: false,
          error: 'Evidence file not found.'
        };
      }

      return {
        success: true,
        data: {
          filename: evidence.filename,
          mimetype: evidence.mimetype,
          size: evidence.size,
          data: Buffer.from(evidence.data)
        }
      };
    } catch (error: any) {
      console.error('Error downloading evidence file:', error);
      return {
        success: false,
        error: 'Failed to download evidence file.'
      };
    }
  }

  /**
   * Delete evidence file
   */
  async deleteEvidenceFile(evidenceId: string): Promise<ServiceResult<{ message: string }>> {
    try {
      const evidence = await this.prisma.evidenceFile.findUnique({
        where: { id: evidenceId },
        include: {
          incident: {
            include: {
              event: true
            }
          }
        }
      });

      if (!evidence) {
        return {
          success: false,
          error: 'Evidence file not found.'
        };
      }

      await this.prisma.evidenceFile.delete({ where: { id: evidenceId } });

      // Log evidence file deletion
      await logAudit({
        action: 'evidence_file_deleted',
        targetType: 'EvidenceFile',
        targetId: evidence.id,
        userId: evidence.uploaderId || undefined,
        eventId: evidence.incident.eventId
      });

      return {
        success: true,
        data: { message: 'Evidence file deleted.' }
      };
    } catch (error: any) {
      console.error('Error deleting evidence file:', error);
      return {
        success: false,
        error: 'Failed to delete evidence file.'
      };
    }
  }

  /**
   * Get user's reports across all accessible events with complex filtering and pagination
   */
  async getUserIncidents(userId: string, query: IncidentQuery): Promise<ServiceResult<UserIncidentsResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        event: eventFilter,
        assigned,
        sort = 'createdAt',
        order = 'desc'
      } = query;

      // Validate and parse pagination
      const pageNum = parseInt(page.toString());
      const limitNum = parseInt(limit.toString());

      if (pageNum < 1 || limitNum < 1) {
        return {
          success: false,
          error: 'Invalid pagination parameters. Page and limit must be positive integers.'
        };
      }

      if (limitNum > 100) {
        return {
          success: false,
          error: 'Limit cannot exceed 100 items per page.'
        };
      }

      const skip = (pageNum - 1) * limitNum;

      // Get user's event roles using unified RBAC
      const directEventRoles = await this.unifiedRBAC.getUserRoles(userId, 'event');
      const orgRoles = await this.unifiedRBAC.getUserRoles(userId, 'organization');
      
      // Collect accessible events and their roles
      const eventRoles = new Map();
      const processedEvents = new Set();
      
      // Process direct event roles
      for (const userRole of directEventRoles) {
        const eventId = userRole.scopeId;
        if (!processedEvents.has(eventId)) {
          processedEvents.add(eventId);
          const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, slug: true }
          });
          if (event) {
            eventRoles.set(eventId, { event, roles: [] });
          }
        }
        eventRoles.get(eventId)?.roles.push(userRole.role.name);
      }
      
      // Process org admin inheritance - org admins get event_admin rights on org events
      const orgAdminRoles = orgRoles.filter((role: any) => role.role.name === 'org_admin');
      for (const orgRole of orgAdminRoles) {
        const orgEvents = await this.prisma.event.findMany({
          where: { organizationId: orgRole.scopeId },
          select: { id: true, name: true, slug: true }
        });
        
        for (const event of orgEvents) {
          if (!processedEvents.has(event.id)) {
            processedEvents.add(event.id);
            eventRoles.set(event.id, { event, roles: [] });
          }
          // Org admins inherit event_admin rights
          if (!eventRoles.get(event.id)?.roles.includes('event_admin')) {
            eventRoles.get(event.id)?.roles.push('event_admin');
          }
        }
      }

      if (eventRoles.size === 0) {
        return {
          success: true,
          data: { incidents: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 }
        };
      }

      // Build where clause based on user's access
      const eventIds = Array.from(eventRoles.keys());
      let whereClause: any = {
        eventId: { in: eventIds }
      };

      // Role-based filtering: Reporters only see their own reports
      const reporterOnlyEvents: string[] = [];
      const responderAdminEvents: string[] = [];

      eventRoles.forEach((eventData: any, eventId: string) => {
        const roles = eventData.roles;
        const isResponderOrAbove = roles.some((r: string) => ['responder', 'event_admin', 'system_admin'].includes(r));

        if (isResponderOrAbove) {
          responderAdminEvents.push(eventId);
        } else {
          reporterOnlyEvents.push(eventId);
        }
      });

      // Build complex where clause for role-based access
      if (reporterOnlyEvents.length > 0 && responderAdminEvents.length > 0) {
        whereClause = {
          OR: [
            // Reports in events where user is responder/admin (all reports)
            { eventId: { in: responderAdminEvents } },
            // Reports in events where user is only reporter (only their reports)
            {
              AND: [
                { eventId: { in: reporterOnlyEvents } },
                { reporterId: userId }
              ]
            }
          ]
        };
      } else if (reporterOnlyEvents.length > 0) {
        // User is only reporter in all events
        whereClause = {
          eventId: { in: reporterOnlyEvents },
          reporterId: userId
        };
      } else {
        // User is responder/admin in all events
        whereClause = {
          eventId: { in: responderAdminEvents }
        };
      }

      // Apply filters while preserving access control
      const filters = [];

      // Preserve the original access control as the base
      const baseAccessControl = { ...whereClause };

      if (search) {
        filters.push({
          OR: [
            { title: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        });
      }

      if (status) {
        filters.push({ state: status });
      }

      if (eventFilter) {
        // Filter by specific event slug
        const targetEvent = Array.from(eventRoles.values()).find((e: any) => e.event.slug === eventFilter);
        if (targetEvent) {
          filters.push({ eventId: targetEvent.event.id });
        } else {
          // User doesn't have access to this event
          return {
            success: true,
            data: { incidents: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 }
          };
        }
      }

      if (assigned === 'me') {
        filters.push({ assignedResponderId: userId });
      } else if (assigned === 'unassigned') {
        filters.push({ assignedResponderId: null });
      }

      // Combine base access control with filters using AND
      if (filters.length > 0) {
        whereClause = {
          AND: [
            baseAccessControl,
            ...filters
          ]
        };
      }

      // Build sort clause
      const validSortFields = ['createdAt', 'updatedAt', 'title', 'state'];
      const sortField = validSortFields.includes(sort as string) ? sort as string : 'createdAt';
      const sortOrder = order === 'asc' ? 'asc' : 'desc';

      // Get total count
      const total = await this.prisma.incident.count({ where: whereClause });

      // Get reports with pagination
      const incidents = await this.prisma.incident.findMany({
        where: whereClause,
        include: {
          event: {
            select: { id: true, name: true, slug: true }
          },
          reporter: {
            select: { id: true, name: true, email: true }
          },
          assignedResponder: {
            select: { id: true, name: true, email: true }
          },
          evidenceFiles: {
            select: { 
              id: true, 
              filename: true, 
              mimetype: true, 
              size: true, 
              createdAt: true,
              uploader: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          comments: {
            select: {
              id: true,
              visibility: true
            }
          }
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limitNum
      });

      // Add user's role in each event to the response and calculate visible comment count
      const reportsWithRoles = incidents.map(incident => {
        const userRoles = eventRoles.get(incident.eventId)?.roles || [];
        const isResponderOrAbove = userRoles.some((r: string) => ['responder', 'event_admin', 'system_admin'].includes(r));
        
        // Calculate comment count based on user permissions
        let visibleCommentCount = 0;
        if (isResponderOrAbove) {
          // Responders and above can see all comments
          visibleCommentCount = incident.comments.length;
        } else {
          // Reporters can only see public comments (and internal if they're assigned to the report)
          const isAssignedToReport = incident.assignedResponderId === userId;
          visibleCommentCount = incident.comments.filter(comment => 
            comment.visibility === 'public' || (comment.visibility === 'internal' && isAssignedToReport)
          ).length;
        }

        // Remove the comments array and add the count
        const { comments, ...incidentWithoutComments } = incident;
        return {
          ...incidentWithoutComments,
          _count: {
            comments: visibleCommentCount
          },
          userRoles
        };
      });

      return {
        success: true,
        data: {
          incidents: reportsWithRoles,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error: any) {
      console.error('Error fetching user incidents:', error);
      return {
        success: false,
        error: 'Failed to fetch user incidents.'
      };
    }
  }

  /**
   * Check if user has access to a report
   */
  async checkIncidentAccess(userId: string, incidentId: string, eventId?: string): Promise<ServiceResult<{ hasAccess: boolean; isReporter: boolean; roles: string[] }>> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { event: true }
      });

      if (!incident) {
        return {
          success: false,
          error: 'Report not found.'
        };
      }

      if (eventId && incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check if user is the reporter
      const isReporter = !!(incident.reporterId && userId === incident.reporterId);

      // Use unified RBAC service to get user roles
      const userRoles = await this.unifiedRBAC.getUserRoles(userId, 'event', incident.eventId);
      const roles = userRoles.map((userRole: { role: { name: string } }) => {
        // Map unified role names back to display names
        switch (userRole.role.name) {
          case 'system_admin': return 'system_admin';
          case 'event_admin': return 'event_admin';
          case 'responder': return 'responder';
          case 'reporter': return 'reporter';
          default: return userRole.role.name;
        }
      });

      // Also check for organization admin inheritance
      const hasOrgAdminRole = await this.unifiedRBAC.hasEventRole(userId, incident.eventId, ['event_admin']);
      if (hasOrgAdminRole && !roles.includes('event_admin')) {
        roles.push('event_admin');
      }

      const isResponderOrAbove = roles.some((r: string) => ['responder', 'event_admin', 'system_admin'].includes(r));
      const hasAccess = isReporter || isResponderOrAbove;

      return {
        success: true,
        data: { hasAccess, isReporter, roles }
      };
    } catch (error: any) {
      console.error('Error checking report access:', error);
      return {
        success: false,
        error: 'Failed to check report access.'
      };
    }
  }

  /**
   * Check if user can edit a report title
   */
  async checkIncidentEditAccess(userId: string, incidentId: string, eventId: string): Promise<ServiceResult<{ canEdit: boolean; reason?: string }>> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check permissions: reporter can edit their own report, or user must be Admin/System Admin
      const isReporter = !!(incident.reporterId && userId === incident.reporterId);

      // Use unified RBAC service to check roles
      const hasAdminRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['event_admin', 'system_admin']);
      const canEdit = isReporter || hasAdminRole;

      return {
        success: true,
        data: { 
          canEdit, 
          ...(canEdit ? {} : { reason: 'Insufficient permissions to edit this report title.' })
        }
      };
    } catch (error: any) {
      console.error('Error checking report edit access:', error);
      return {
        success: false,
        error: 'Failed to check report edit access.'
      };
    }
  }

  /**
   * Update report location (with authorization check)
   */
  async updateIncidentLocation(eventId: string, incidentId: string, location: string | null, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions if userId provided
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        // Use unified RBAC service to check roles
        const hasResponderRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);
        const canEdit = isReporter || hasResponderRole;

        if (!canEdit) {
          return {
            success: false,
            error: 'Insufficient permissions to edit this report location.'
          };
        }
      }

      // Store original location for audit log
      const originalLocation = incident.location;

      // Update location
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { location: location || null } as any,
        include: { reporter: true },
      });

      // Audit log: location updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_location',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for location update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report location:', error);
      return {
        success: false,
        error: 'Failed to update report location.'
      };
    }
  }

  /**
   * Update report contact preference (with authorization check)
   */
  async updateIncidentContactPreference(eventId: string, incidentId: string, contactPreference: string, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Validate contact preference
      const validPreferences = ['email', 'phone', 'in_person', 'no_contact'];
      if (!validPreferences.includes(contactPreference)) {
        return {
          success: false,
          error: 'Invalid contact preference. Must be: email, phone, in_person, or no_contact.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions - only reporter can edit contact preference
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        if (!isReporter) {
          return {
            success: false,
            error: 'Only the reporter can edit contact preference.'
          };
        }
      }

      // Store original contact preference for audit log
      const originalContactPreference = incident.contactPreference;

      // Update contact preference
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { contactPreference } as any,
        include: { reporter: true },
      });

      // Audit log: contact preference updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_contact_preference',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for contact preference update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report contact preference:', error);
      return {
        success: false,
        error: 'Failed to update report contact preference.'
      };
    }
  }

  /**
   * Update report type (with authorization check)
   */
  async updateIncidentType(eventId: string, incidentId: string, type: string, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Validate report type
      const validTypes = ['harassment', 'safety', 'other'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          error: 'Invalid report type. Must be: harassment, safety, or other.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions if userId provided
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        // Use unified RBAC to check event permissions
        const hasEventRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);

        const canEdit = isReporter || hasEventRole;

        if (!canEdit) {
          return {
            success: false,
            error: 'Insufficient permissions to edit this report type.'
          };
        }
      }

      // Store original type for audit log
      const originalType = incident.type;

      // Update type
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { type: type as any },
        include: { reporter: true },
      });

      // Audit log: type updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_type',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for type update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report type:', error);
      return {
        success: false,
        error: 'Failed to update report type.'
      };
    }
  }

  /**
   * Update report description (with authorization check)
   */
  async updateIncidentDescription(eventId: string, incidentId: string, description: string, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Validate description
      if (!description || description.trim().length === 0) {
        return {
          success: false,
          error: 'Description is required.'
        };
      }

      if (description.length > 5000) {
        return {
          success: false,
          error: 'Description must be less than 5000 characters.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions - description is more sensitive, only reporter and event admin+
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        // Use unified RBAC to check event permissions (description requires admin+ access)
        const hasEventRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['event_admin', 'system_admin']);

        const canEdit = isReporter || hasEventRole;

        if (!canEdit) {
          return {
            success: false,
            error: 'Insufficient permissions to edit this report description.'
          };
        }
      }

      // Store original description for audit log
      const originalDescription = incident.description;

      // Update description
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { description: description.trim() },
        include: { reporter: true },
      });

      // Audit log: description updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_description',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for description update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report description:', error);
      return {
        success: false,
        error: 'Failed to update report description.'
      };
    }
  }

  /**
   * Update report incident date (with authorization check)
   */
  async updateIncidentIncidentDate(eventId: string, incidentId: string, incidentAt: string | null, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      let incidentDate: Date | null = null;

      // Validate and parse incident date if provided
      if (incidentAt) {
        incidentDate = new Date(incidentAt);
        if (isNaN(incidentDate.getTime())) {
          return {
            success: false,
            error: 'Invalid incident date format.'
          };
        }

        // Check if date is not too far in the future
        const now = new Date();
        const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        if (incidentDate > maxFutureDate) {
          return {
            success: false,
            error: 'Incident date cannot be more than 24 hours in the future.'
          };
        }
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions if userId provided
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        // Use unified RBAC to check event permissions
        const hasEventRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);

        const canEdit = isReporter || hasEventRole;

        if (!canEdit) {
          return {
            success: false,
            error: 'Insufficient permissions to edit this report incident date.'
          };
        }
      }

      // Store original incident date for audit log
      const originalIncidentDate = incident.incidentAt;

      // Update incident date
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { incidentAt: incidentDate },
        include: { reporter: true },
      });

      // Audit log: incident date updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_date',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for incident date update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report incident date:', error);
      return {
        success: false,
        error: 'Failed to update report incident date.'
      };
    }
  }

  /**
   * Update report parties involved (with authorization check)
   */
  async updateIncidentParties(eventId: string, incidentId: string, parties: string | null, userId?: string): Promise<ServiceResult<{ incident: any }>> {
    try {
      // Validate parties if provided
      if (parties && parties.length > 1000) {
        return {
          success: false,
          error: 'Parties involved must be less than 1000 characters.'
        };
      }

      // Check report exists and belongs to event
      const incident = await this.prisma.incident.findUnique({
        where: { id: incidentId },
        include: { reporter: true },
      });

      if (!incident || incident.eventId !== eventId) {
        return {
          success: false,
          error: 'Report not found for this event.'
        };
      }

      // Check edit permissions if userId provided
      if (userId) {
        const isReporter = !!(incident.reporterId && userId === incident.reporterId);

        // Use unified RBAC to check event permissions
        const hasEventRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);

        const canEdit = isReporter || hasEventRole;

        if (!canEdit) {
          return {
            success: false,
            error: 'Insufficient permissions to edit this report parties involved.'
          };
        }
      }

      // Store original parties for audit log
      const originalParties = incident.parties;

      // Update parties
      const updated = await this.prisma.incident.update({
        where: { id: incidentId },
        data: { parties: parties ? parties.trim() : null },
        include: { reporter: true },
      });

      // Audit log: parties updated
      try {
        await logAudit({
          eventId: eventId,
          userId: userId,
          action: 'update_incident_parties',
          targetType: 'incident',
          targetId: incidentId,
        });
      } catch (auditError) {
        console.error('Failed to log audit for parties update:', auditError);
        // Don't fail the update if audit logging fails
      }

      return {
        success: true,
        data: { incident: updated }
      };
    } catch (error: any) {
      console.error('Error updating report parties:', error);
      return {
        success: false,
        error: 'Failed to update report parties involved.'
      };
    }
  }

  /**
   * Get reports for a specific event with enhanced filtering, search, and optional stats
   */
  async getEventIncidents(eventId: string, userId: string, query: IncidentQuery & { includeStats?: boolean }): Promise<ServiceResult<{
    incidents: IncidentWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats?: {
      submitted: number;
      acknowledged: number;
      investigating: number;
      resolved: number;
      closed: number;
      total: number;
    };
  }>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        severity,
        assigned,
        sort = 'createdAt',
        order = 'desc',
        userId: filterUserId,
        incidentIds,
        includeStats = false
      } = query;

      // Validate pagination
      const pageNum = parseInt(page.toString());
      const limitNum = Math.min(parseInt(limit.toString()), 100);

      if (pageNum < 1 || limitNum < 1) {
        return {
          success: false,
          error: 'Invalid pagination parameters'
        };
      }

      const skip = (pageNum - 1) * limitNum;

      // Check if user has access to this event
      const hasAccess = await this.unifiedRBAC.hasEventRole(userId, eventId, ['reporter', 'responder', 'event_admin', 'system_admin']);
      
      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied. User does not have permission for this event.'
        };
      }

      // Check user's role to determine comment visibility and report filtering
      const isResponderOrAbove = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);
      
      // For reporters, only show their own reports unless a specific user filter is applied
      const reporterFilter = !isResponderOrAbove && !filterUserId ? { reporterId: userId } : {};

      // Get reports with includes
      const incidents = await this.prisma.incident.findMany({
        where: {
          eventId,
          ...reporterFilter,
          ...(search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {}),
          ...(status ? { state: status as any } : {}),
          ...(severity ? { severity: severity as any } : {}),
          ...(assigned === 'me' ? { assignedResponderId: userId } : {}),
          ...(assigned === 'unassigned' ? { assignedResponderId: null } : {}),
          ...(filterUserId ? { reporterId: filterUserId } : {}),
          ...(incidentIds && incidentIds.length > 0 ? { id: { in: incidentIds } } : {})
        },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedResponder: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          evidenceFiles: {
            select: {
              id: true,
              filename: true,
              mimetype: true,
              size: true,
              createdAt: true,
              uploader: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          comments: {
            select: {
              id: true,
              visibility: true
            }
          }
        },
        orderBy: { [sort]: order === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limitNum
      });

      // Add user roles to each report and calculate visible comment count
      const reportsWithRoles = incidents.map(incident => {
        // Calculate comment count based on user permissions
        let visibleCommentCount = 0;
        if (incident.comments && Array.isArray(incident.comments)) {
          if (isResponderOrAbove) {
            // Responders and above can see all comments
            visibleCommentCount = incident.comments.length;
          } else {
            // Reporters can only see public comments (and internal if they're assigned to the report)
            const isAssignedToReport = incident.assignedResponderId === userId;
            visibleCommentCount = incident.comments.filter(comment => 
              comment.visibility === 'public' || (comment.visibility === 'internal' && isAssignedToReport)
            ).length;
          }
        }

        // Remove the comments array and add the count
        const { comments, ...incidentWithoutComments } = incident;
        return {
          ...incidentWithoutComments,
          _count: {
            comments: visibleCommentCount
          },
          userRoles: [] // Roles are not directly available here, but can be fetched if needed
        };
      });

      // Get total count
      const total = await this.prisma.incident.count({
        where: {
          eventId,
          ...reporterFilter,
          ...(search ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {}),
          ...(status ? { state: status as any } : {}),
          ...(severity ? { severity: severity as any } : {}),
          ...(assigned === 'me' ? { assignedResponderId: userId } : {}),
          ...(assigned === 'unassigned' ? { assignedResponderId: null } : {}),
          ...(filterUserId ? { reporterId: filterUserId } : {}),
          ...(incidentIds && incidentIds.length > 0 ? { id: { in: incidentIds } } : {})
        }
      });

      // Get stats if requested
      let stats: {
        submitted: number;
        acknowledged: number;
        investigating: number;
        resolved: number;
        closed: number;
        total: number;
      } | undefined;
      
      if (includeStats) {
        try {
          const statsResult = await this.prisma.incident.groupBy({
            by: ['state'],
            where: {
              eventId,
              ...reporterFilter,
              ...(search ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } }
                ]
              } : {}),
              ...(status ? { state: status as any } : {}),
              ...(severity ? { severity: severity as any } : {}),
              ...(assigned === 'me' ? { assignedResponderId: userId } : {}),
              ...(assigned === 'unassigned' ? { assignedResponderId: null } : {}),
              ...(filterUserId ? { reporterId: filterUserId } : {}),
              ...(incidentIds && incidentIds.length > 0 ? { id: { in: incidentIds } } : {})
            },
            _count: true
          });

          stats = {
            submitted: 0,
            acknowledged: 0,
            investigating: 0,
            resolved: 0,
            closed: 0,
            total: 0
          };

          statsResult.forEach(stat => {
            const count = stat._count || 0;
            switch (stat.state) {
              case 'submitted':
                stats!.submitted = count;
                break;
              case 'acknowledged':
                stats!.acknowledged = count;
                break;
              case 'investigating':
                stats!.investigating = count;
                break;
              case 'resolved':
                stats!.resolved = count;
                break;
              case 'closed':
                stats!.closed = count;
                break;
            }
            stats!.total += count;
          });
        } catch (statsError) {
          console.error('Error fetching stats:', statsError);
          // Don't fail the entire request if stats fail
          stats = {
            submitted: 0,
            acknowledged: 0,
            investigating: 0,
            resolved: 0,
            closed: 0,
            total: 0
          };
        }
      }

      // Calculate total pages
      const totalPages = Math.ceil(total / limitNum);

      return {
        success: true,
        data: {
          incidents: reportsWithRoles,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          ...(stats && { stats })
        }
      };
    } catch (error: any) {
      console.error('Error fetching event incidents:', error);
      return {
        success: false,
        error: 'Failed to fetch event reports'
      };
    }
  }

  // Bulk update reports (assign, status change, delete)
  async bulkUpdateIncidents(eventId: string, incidentIds: string[], action: string, options: {
    assignedTo?: string;
    status?: string;
    notes?: string;
    userId: string;
  }): Promise<ServiceResult<{ updated: number; errors: string[] }>> {
    try {
      const { assignedTo, status, notes, userId } = options;
      let updated = 0;
      const errors: string[] = [];

      // Verify user has access to the event using unified RBAC
      const hasEventRole = await this.unifiedRBAC.hasEventRole(userId, eventId, ['responder', 'event_admin', 'system_admin']);

      if (!hasEventRole) {
        return {
          success: false,
          error: 'Access denied: Insufficient permissions for bulk operations'
        };
      }

      // Process each report
      for (const incidentId of incidentIds) {
        try {
          // Verify report exists and belongs to event
          const incident = await this.prisma.incident.findFirst({
            where: {
              id: incidentId,
              eventId
            }
          });

          if (!incident) {
            errors.push(`Report ${incidentId} not found or not in this event`);
            continue;
          }

          // Perform the action
          switch (action) {
            case 'assign':
              if (assignedTo) {
                await this.prisma.incident.update({
                  where: { id: incidentId },
                  data: { assignedResponderId: assignedTo }
                });
                updated++;

                // Audit log: incident assigned
                try {
                  await logAudit({
                    eventId: eventId,
                    userId: userId,
                    action: 'assign_incident',
                    targetType: 'incident',
                    targetId: incidentId,
                  });
                } catch (auditError) {
                  console.error('Failed to log audit for bulk assign:', auditError);
                }
              } else {
                errors.push(`Report ${incidentId}: assignedTo is required for assign action`);
              }
              break;

            case 'status':
              if (status) {
                // Validate status is a valid ReportState
                const validStates = ['submitted', 'acknowledged', 'investigating', 'resolved', 'closed'];
                if (!validStates.includes(status)) {
                  errors.push(`Report ${incidentId}: Invalid status ${status}`);
                  continue;
                }
                
                await this.prisma.incident.update({
                  where: { id: incidentId },
                  data: { state: status as any }
                });
                updated++;

                // Audit log: incident status changed
                try {
                  await logAudit({
                    eventId: eventId,
                    userId: userId,
                    action: 'update_incident_status',
                    targetType: 'incident',
                    targetId: incidentId,
                  });
                } catch (auditError) {
                  console.error('Failed to log audit for bulk status change:', auditError);
                }
              } else {
                errors.push(`Report ${incidentId}: status is required for status action`);
              }
              break;

            case 'delete':
              // Delete associated evidence files first
              await this.prisma.evidenceFile.deleteMany({
                where: { incidentId }
              });
              
              // Delete associated comments
              await this.prisma.incidentComment.deleteMany({
                where: { incidentId }
              });
              
              // Delete the report
              await this.prisma.incident.delete({
                where: { id: incidentId }
              });
              updated++;

              // Audit log: incident deleted
              try {
                await logAudit({
                  eventId: eventId,
                  userId: userId,
                  action: 'delete_incident',
                  targetType: 'incident',
                  targetId: incidentId,
                });
              } catch (auditError) {
                console.error('Failed to log audit for bulk delete:', auditError);
              }
              break;

            default:
              errors.push(`Report ${incidentId}: Unknown action ${action}`);
          }
        } catch (error: any) {
          errors.push(`Report ${incidentId}: ${error.message}`);
        }
      }

      return {
        success: true,
        data: {
          updated,
          errors
        }
      };
    } catch (error: any) {
      console.error('Error in bulk update incidents:', error);
      return {
        success: false,
        error: 'Failed to perform bulk update'
      };
    }
  }
}