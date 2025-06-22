import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { EventService } from "../services/event.service";
import { UnifiedRBACService } from "../services/unified-rbac.service";

const prisma = new PrismaClient();
const unifiedRBAC = new UnifiedRBACService(prisma);

/**
 * User object structure expected in authenticated requests
 */
interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * Role names supported by the RBAC system
 */
type RoleName = "System Admin" | "Event Admin" | "Responder" | "Reporter";

/**
 * Helper function to map old role names to unified role names
 */
function mapToUnifiedRoleName(role: RoleName): string {
  switch (role) {
    case 'System Admin': return 'system_admin';
    case 'Event Admin': return 'event_admin';
    case 'Responder': return 'responder';
    case 'Reporter': return 'reporter';
  }
}

/**
 * Middleware to require a user to have one of the allowed roles for an event.
 * Uses unified RBAC system with organization admin inheritance.
 * 
 * @param allowedRoles - Array of role names that are allowed to access the resource
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * app.get('/admin-endpoint', requireRole(['Event Admin', 'System Admin']), handler);
 * ```
 */
export function requireRole(allowedRoles: RoleName[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = req.params as Record<string, string>;
      
      // Extract eventId from params (could be 'eventId' or 'id')
      let eventId = params.eventId || params.id;
      
      // If no eventId but we have a slug, try to get eventId from slug
      if (!eventId && params.slug) {
        try {
          const eventService = new EventService(prisma);
          const foundEventId = await eventService.getEventIdBySlug(params.slug);
          if (foundEventId) {
            eventId = foundEventId;
          }
        } catch (error) {
          console.error('[RBAC] Error fetching eventId by slug:', error);
        }
      }
      
      // Check authentication
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = req.user as any;

      // System Admins can access anything
      if (allowedRoles.includes('System Admin')) {
        const isSystemAdmin = await unifiedRBAC.isSystemAdmin(user.id);
        if (isSystemAdmin) {
          next();
          return;
        }
      }

      // For event-specific routes, use unified RBAC with org admin inheritance
      if (eventId) {
        // Map old role names to new unified role names
        const unifiedRoleNames = allowedRoles.map(role => {
          if (role === 'System Admin') return 'system_admin';
          if (role === 'Event Admin') return 'event_admin';
          if (role === 'Responder') return 'responder';
          if (role === 'Reporter') return 'reporter';
          return 'unknown_role'; // This should never happen with our type system
        });

        // Check if user has event role (includes org admin inheritance)
        const hasEventRole = await unifiedRBAC.hasEventRole(user.id, eventId, unifiedRoleNames);
        
        if (!hasEventRole) {
          res.status(403).json({ error: "Forbidden: insufficient role" });
          return;
        }
        
        next();
      } else {
        // For non-event-specific routes, check if user has any of the allowed roles globally
        const unifiedRoleNames = allowedRoles.map(role => {
          if (role === 'System Admin') return 'system_admin';
          if (role === 'Event Admin') return 'event_admin';
          if (role === 'Responder') return 'responder';
          if (role === 'Reporter') return 'reporter';
          return 'unknown_role'; // This should never happen with our type system
        });

        // Check for system-level roles
        const hasSystemRole = await unifiedRBAC.hasRole(user.id, unifiedRoleNames, 'system');
        
        if (!hasSystemRole) {
          res.status(403).json({ error: "Forbidden: insufficient role" });
          return;
        }

        next();
      }
    } catch (err: any) {
      console.error('[RBAC] Error in requireRole middleware:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to require a user to be a System Admin (global role).
 * Uses unified RBAC system.
 * 
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * app.post('/admin/events', requireSystemAdmin(), createEventHandler);
 * ```
 */
export function requireSystemAdmin() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    try {
      const user = req.user as any;
      const isSystemAdmin = await unifiedRBAC.isSystemAdmin(user.id);
      
      if (!isSystemAdmin) {
        res.status(403).json({ error: "Forbidden: System Admins only" });
        return;
      }
      
      next();
    } catch (err: any) {
      res
        .status(500)
        .json({ error: "System Admin check failed", details: err.message });
    }
  };
} 