/**
 * API utilities for audit log operations
 */

import { AuditLogResponse, AuditLogFilters } from '@/types/audit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Build query string from filters
 */
function buildQueryString(filters: AuditLogFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  return params.toString();
}

/**
 * Fetch audit logs for a specific event
 */
export async function fetchEventAuditLogs(
  eventId: string,
  filters: AuditLogFilters = {}
): Promise<AuditLogResponse> {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE_URL}/api/audit/events/${eventId}/audit${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event audit logs: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch audit logs for a specific organization
 */
export async function fetchOrganizationAuditLogs(
  organizationId: string,
  filters: AuditLogFilters = {}
): Promise<AuditLogResponse> {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE_URL}/api/audit/organizations/${organizationId}/audit${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch organization audit logs: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch system-wide audit logs (admin only)
 */
export async function fetchSystemAuditLogs(
  filters: AuditLogFilters = {}
): Promise<AuditLogResponse> {
  const queryString = buildQueryString(filters);
  const url = `${API_BASE_URL}/api/audit/system/audit${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch system audit logs: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Format action name for display
 */
export function formatActionName(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get action color for display
 */
export function getActionColor(action: string): string {
  if (action.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (action.includes('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (action.includes('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (action.includes('resolve')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (action.includes('close')) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  if (action.includes('login')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
