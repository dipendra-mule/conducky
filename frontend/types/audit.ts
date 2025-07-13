/**
 * Audit log types for the frontend
 */

// Define the possible target types for audit logs
export type AuditTargetType = 
  | 'User'
  | 'Event'
  | 'Organization'
  | 'OrganizationMembership'
  | 'OrganizationInviteLink'
  | 'Incident'
  | 'IncidentComment'
  | 'RelatedFile'
  | 'EventInviteLink'
  | 'UserRole';

// Human-readable labels for target types
export const TARGET_TYPE_LABELS: Record<AuditTargetType, string> = {
  'User': 'User',
  'Event': 'Event',
  'Organization': 'Organization',
  'OrganizationMembership': 'Organization Membership',
  'OrganizationInviteLink': 'Organization Invite',
  'Incident': 'Incident',
  'IncidentComment': 'Comment',
  'RelatedFile': 'Related File',
  'EventInviteLink': 'Event Invite',
  'UserRole': 'User Role',
};

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  userId: string | null;
  timestamp: string;
  organizationId?: string | null;
  eventId?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  event?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: AuditLogPagination;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  userId?: string;
  organizationId?: string;
  eventId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'timestamp' | 'action' | 'targetType';
  sortOrder?: 'asc' | 'desc';
}

export type AuditLogScope = 'event' | 'organization' | 'system';
