import { PrismaClient } from '@prisma/client';

// Follow the same pattern as organization.service.ts
const defaultPrisma = new PrismaClient();

// Type for RoleScope enum (until Prisma types are updated)
type RoleScope = 'system' | 'organization' | 'event';

/**
 * Unified RBAC Service
 * Handles all role-based access control using the new unified role system
 */
export class UnifiedRBACService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
  }

  /**
   * Check if user has any of the specified roles in the given scope
   */
  async hasRole(
    userId: string,
    roleNames: string[],
    scopeType?: RoleScope,
    scopeId?: string
  ): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId, scopeType, scopeId);
      return userRoles.some((userRole: any) => roleNames.includes(userRole.role.name));
    } catch (error) {
      console.error('[UnifiedRBAC] Error checking role:', error);
      return false;
    }
  }

  /**
   * Check if user is system admin
   */
  async isSystemAdmin(userId: string): Promise<boolean> {
    return this.hasRole(userId, ['system_admin'], 'system', 'SYSTEM');
  }

  /**
   * Check if user has organization role (with system admin override)
   */
  async hasOrgRole(
    userId: string,
    organizationId: string,
    roleNames: string[] = ['org_admin', 'org_viewer']
  ): Promise<boolean> {
    // System admins have access to all organizations
    const isSystemAdmin = await this.isSystemAdmin(userId);
    if (isSystemAdmin) {
      return true;
    }

    return this.hasRole(userId, roleNames, 'organization', organizationId);
  }

  /**
   * Check if user has event role (with role inheritance)
   */
  async hasEventRole(
    userId: string,
    eventId: string,
    roleNames: string[] = ['event_admin', 'responder', 'reporter']
  ): Promise<boolean> {
    // System admins have access to all events
    const isSystemAdmin = await this.isSystemAdmin(userId);
    if (isSystemAdmin) {
      return true;
    }

    // Check direct event role
    const hasDirectRole = await this.hasRole(userId, roleNames, 'event', eventId);
    if (hasDirectRole) {
      return true;
    }

    // Check if user has org_admin role for the event's organization (role inheritance)
    const event = await (this.prisma as any).event.findUnique({
      where: { id: eventId },
      select: { organizationId: true }
    });
    
    let hasOrgAdminRole = false;
    if (event?.organizationId) {
      hasOrgAdminRole = await this.hasRole(userId, ['org_admin'], 'organization', event.organizationId);
    }
    
    return hasDirectRole || isSystemAdmin || hasOrgAdminRole;
  }

  /**
   * Get user's roles for a specific scope
   */
  async getUserRoles(
    userId: string,
    scopeType?: RoleScope,
    scopeId?: string
  ) {
    const where: any = { userId };
    
    if (scopeType) {
      where.scopeType = scopeType;
    }
    
    if (scopeId) {
      where.scopeId = scopeId;
    }
    
    return (this.prisma as any).userRole.findMany({
      where,
      include: {
        role: true,
        user: true
      }
    });
  }

  /**
   * Get all roles for a user (for frontend display)
   */
  async getAllUserRoles(userId: string) {
    const userRoles = await (this.prisma as any).userRole.findMany({
      where: { userId },
      include: {
        role: true
      }
    });

    // Group by scope for easier frontend consumption
    const rolesByScope = {
      system: userRoles.filter((ur: any) => ur.scopeType === 'system').map((ur: any) => ur.role.name),
      organizations: {} as Record<string, string[]>,
      events: {} as Record<string, string[]>
    };

    // Group organization roles
    userRoles
      .filter((ur: any) => ur.scopeType === 'organization')
      .forEach((ur: any) => {
        if (!rolesByScope.organizations[ur.scopeId]) {
          rolesByScope.organizations[ur.scopeId] = [];
        }
        rolesByScope.organizations[ur.scopeId].push(ur.role.name);
      });

    // Group event roles
    userRoles
      .filter((ur: any) => ur.scopeType === 'event')
      .forEach((ur: any) => {
        if (!rolesByScope.events[ur.scopeId]) {
          rolesByScope.events[ur.scopeId] = [];
        }
        rolesByScope.events[ur.scopeId].push(ur.role.name);
      });

    return rolesByScope;
  }

  /**
   * Grant a role to a user
   */
  async grantRole(
    userId: string,
    roleName: string,
    scopeType: RoleScope,
    scopeId: string,
    grantedBy?: string
  ): Promise<boolean> {
    try {
      const role = await (this.prisma as any).unifiedRole.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        console.error(`[UnifiedRBAC] Role not found: ${roleName}`);
        return false;
      }

      await (this.prisma as any).userRole.upsert({
        where: {
          user_role_unique: {
            userId,
            roleId: role.id,
            scopeType,
            scopeId
          }
        },
        update: {
          grantedById: grantedBy,
          grantedAt: new Date()
        },
        create: {
          userId,
          roleId: role.id,
          scopeType,
          scopeId,
          grantedById: grantedBy,
          grantedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('[UnifiedRBAC] Error granting role:', error);
      return false;
    }
  }

  /**
   * Revoke a role from a user
   */
  async revokeRole(
    userId: string,
    roleName: string,
    scopeType: RoleScope,
    scopeId: string
  ): Promise<boolean> {
    try {
      const role = await (this.prisma as any).unifiedRole.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        console.error(`[UnifiedRBAC] Role not found: ${roleName}`);
        return false;
      }

      await (this.prisma as any).userRole.deleteMany({
        where: {
          userId,
          roleId: role.id,
          scopeType,
          scopeId
        }
      });

      return true;
    } catch (error) {
      console.error('[UnifiedRBAC] Error revoking role:', error);
      return false;
    }
  }

  /**
   * Get role hierarchy level for permission comparison
   */
  async getRoleLevel(roleName: string): Promise<number> {
    try {
      const role = await (this.prisma as any).unifiedRole.findUnique({
        where: { name: roleName }
      });
      return role?.level || 0;
    } catch (error) {
      console.error('[UnifiedRBAC] Error getting role level:', error);
      return 0;
    }
  }

  /**
   * Check if user has minimum role level in scope
   */
  async hasMinimumLevel(
    userId: string,
    minLevel: number,
    scopeType?: RoleScope,
    scopeId?: string
  ): Promise<boolean> {
    try {
      const userRoles = await this.getUserRoles(userId, scopeType, scopeId);
      const maxLevel = Math.max(...userRoles.map((ur: any) => ur.role.level));
      return maxLevel >= minLevel;
    } catch (error) {
      console.error('[UnifiedRBAC] Error checking minimum level:', error);
      return false;
    }
  }


}

// Export singleton instance
export const unifiedRBAC = new UnifiedRBACService(); 