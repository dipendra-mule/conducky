import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/rbac';

const prisma = new PrismaClient();

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'action' | 'targetType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  userId: string | null;
  timestamp: Date;
  organizationId?: string | null;
  eventId?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get audit logs for a specific event
 */
export const getEventAuditLogs = [
  requireRole(['event_admin', 'responder']),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const {
        page = 1,
        limit = 50,
        action,
        targetType,
        userId,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query as AuditLogQuery;

      // Validate pagination
      const pageNum = Math.max(1, parseInt(page.toString()));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString())));
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const whereClause: any = {
        eventId: eventId
      };

      if (action) {
        whereClause.action = action;
      }

      if (targetType) {
        whereClause.targetType = targetType;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp.gte = new Date(startDate.toString());
        }
        if (endDate) {
          whereClause.timestamp.lte = new Date(endDate.toString());
        }
      }

      // Build order clause
      const orderBy: any = {};
      if (sortBy === 'timestamp') {
        orderBy.timestamp = sortOrder;
      } else if (sortBy === 'action') {
        orderBy.action = sortOrder;
      } else if (sortBy === 'targetType') {
        orderBy.targetType = sortOrder;
      }

      // Get total count
      const total = await prisma.auditLog.count({
        where: whereClause
      });

      // Get audit logs
      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum      });

      const response: AuditLogResponse = {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          userId: log.userId,
          timestamp: log.timestamp,
          organizationId: log.organizationId,
          eventId: log.eventId,
          user: log.user
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching event audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
];

/**
 * Get audit logs for a specific organization
 */
export const getOrganizationAuditLogs = [
  requireRole(['org_admin']),
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const {
        page = 1,
        limit = 50,
        action,
        targetType,
        userId,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query as AuditLogQuery;

      // Validate pagination
      const pageNum = Math.max(1, parseInt(page.toString()));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString())));
      const offset = (pageNum - 1) * limitNum;      // Build where clause to include both organization-level and event-level logs
      // First, get all events for this organization
      const organizationEvents = await prisma.event.findMany({
        where: { organizationId: organizationId },
        select: { id: true }
      });
      
      const eventIds = organizationEvents.map(event => event.id);
      
      // Build additional filters
      const additionalFilters: any = {};
      
      if (action) {
        additionalFilters.action = action;
      }

      if (targetType) {
        additionalFilters.targetType = targetType;
      }

      if (userId) {
        additionalFilters.userId = userId;
      }

      if (startDate || endDate) {
        additionalFilters.timestamp = {};
        if (startDate) {
          additionalFilters.timestamp.gte = new Date(startDate.toString());
        }
        if (endDate) {
          additionalFilters.timestamp.lte = new Date(endDate.toString());
        }
      }
      
      // Query for logs that are either:
      // 1. Organization-level logs (organizationId matches, eventId is null)
      // 2. Event-level logs (eventId matches any event in this organization)
      const whereClause: any = {
        AND: [
          {
            OR: [
              {
                organizationId: organizationId,
                eventId: null // Organization-level logs
              },
              eventIds.length > 0 ? {
                eventId: { in: eventIds } // Event-level logs
              } : null
            ].filter(Boolean) // Remove null values
          },
          additionalFilters
        ]
      };

      // Build order clause
      const orderBy: any = {};
      if (sortBy === 'timestamp') {
        orderBy.timestamp = sortOrder;
      } else if (sortBy === 'action') {
        orderBy.action = sortOrder;
      } else if (sortBy === 'targetType') {
        orderBy.targetType = sortOrder;
      }

      // Get total count
      const total = await prisma.auditLog.count({
        where: whereClause
      });

      // Get audit logs
      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      });      const response: AuditLogResponse = {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          userId: log.userId,
          timestamp: log.timestamp,
          organizationId: log.organizationId,
          eventId: log.eventId,
          user: log.user
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching organization audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
];

/**
 * Get system-wide audit logs (System Admin only)
 */
export const getSystemAuditLogs = [
  requireRole(['system_admin']),
  async (req: Request, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        targetType,
        userId,
        organizationId,
        eventId,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = req.query as AuditLogQuery & { organizationId?: string; eventId?: string };

      // Validate pagination
      const pageNum = Math.max(1, parseInt(page.toString()));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString())));
      const offset = (pageNum - 1) * limitNum;

      // Build where clause
      const whereClause: any = {};

      if (action) {
        whereClause.action = action;
      }

      if (targetType) {
        whereClause.targetType = targetType;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (organizationId) {
        whereClause.organizationId = organizationId;
      }

      if (eventId) {
        whereClause.eventId = eventId;
      }

      if (startDate || endDate) {
        whereClause.timestamp = {};
        if (startDate) {
          whereClause.timestamp.gte = new Date(startDate.toString());
        }
        if (endDate) {
          whereClause.timestamp.lte = new Date(endDate.toString());
        }
      }

      // Build order clause
      const orderBy: any = {};
      if (sortBy === 'timestamp') {
        orderBy.timestamp = sortOrder;
      } else if (sortBy === 'action') {
        orderBy.action = sortOrder;
      } else if (sortBy === 'targetType') {
        orderBy.targetType = sortOrder;
      }

      // Get total count
      const total = await prisma.auditLog.count({
        where: whereClause
      });

      // Get audit logs
      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limitNum
      });      const response = {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          userId: log.userId,
          timestamp: log.timestamp,
          organizationId: log.organizationId,
          eventId: log.eventId,
          user: log.user,
          event: log.event,
          organization: log.organization
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching system audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
];
