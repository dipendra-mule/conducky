/**
 * General Helper Utilities
 * 
 * This module contains general-purpose helper functions
 */

import crypto from 'crypto';
import { prisma } from '../config/database';
import { UnifiedRBACService } from '../services/unified-rbac.service';

/**
 * Get event ID by slug
 * @param slug - The event slug
 * @returns Promise<string | null> - Event ID or null if not found
 */
export async function getEventIdBySlug(slug: string): Promise<string | null> {
  const event = await prisma.event.findUnique({ where: { slug } });
  return event?.id || null;
}

/**
 * Generate a random invite code
 * @param length - Length of the invite code (default: 16)
 * @returns string - Random invite code
 */
export function generateInviteCode(length = 16): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * Get user's role for a specific event
 * @param userId - The user ID
 * @param eventId - The event ID
 * @returns Promise<string | null> - Role name or null if no role
 */
export async function getUserRoleForEvent(userId: string, eventId: string): Promise<string | null> {
  const rbacService = new UnifiedRBACService(prisma);
  const userRoles = await rbacService.getUserRoles(userId, 'event', eventId);
  
  // Return the highest level role if multiple roles exist
  if (userRoles.length === 0) return null;
  
  // Sort by role level (higher level = more permissions) and return the highest
  const sortedRoles = userRoles.sort((a: any, b: any) => (b.role.level || 0) - (a.role.level || 0));
  return sortedRoles[0].role.name;
}



/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns string - Random token
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Sleep/delay function for testing or rate limiting
 * @param ms - Milliseconds to sleep
 * @returns Promise<void>
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 