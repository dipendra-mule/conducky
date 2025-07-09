/**
 * Event Audit Log Viewer
 * Displays audit logs for a specific event
 * Access: event_admin, system_admin
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { EventHeader } from '@/components/shared/EventHeader';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { fetchEventAuditLogs } from '@/lib/audit';
import { AuditLogEntry, AuditLogFilters, AuditLogPagination } from '@/types/audit';
import { Shield, Calendar, Users, Activity } from 'lucide-react';
import { useLogger } from '@/hooks/useLogger';

interface Event {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
}

export default function EventAuditPage() {
  const router = useRouter();
  const { eventSlug } = router.query;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<AuditLogPagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userEventRoles, setUserEventRoles] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Check if user has required permissions
  const hasRequiredRole = userEventRoles.includes('event_admin') || user?.roles?.includes('system_admin');

  // Fetch event details
  useEffect(() => {
    if (!eventSlug || typeof eventSlug !== 'string') return;

    const fetchEvent = async () => {
      setEventLoading(true);
      setEventError(null);
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/slug/${eventSlug}`,
          { credentials: 'include' }
        );
        
        if (!response.ok) {
          throw new Error('Event not found');
        }
        
        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        setEventError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setEventLoading(false);
      }
    };    fetchEvent();
  }, [eventSlug]);

  // Fetch user authentication and roles
  useEffect(() => {
    if (!eventSlug || typeof eventSlug !== 'string') return;

    const fetchAuth = async () => {
      setAuthLoading(true);
      
      try {
        // Fetch user session
        const sessionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/session`,
          { credentials: 'include' }
        );
        const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
        setUser(sessionData ? sessionData.user : null);
        
        // Fetch user's event-specific roles
        const rolesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events/slug/${eventSlug}/my-roles`,
          { credentials: 'include' }
        );
        const rolesData = rolesResponse.ok ? await rolesResponse.json() : null;
        setUserEventRoles(rolesData?.roles || []);
      } catch (err) {
        console.error('Error fetching auth:', err);
        setUser(null);
        setUserEventRoles([]);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchAuth();
  }, [eventSlug]);  // Fetch audit logs
  useEffect(() => {
    if (!event || !user || authLoading) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchEventAuditLogs(event.id, filters);
        setAuditLogs(response.logs);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [event?.id, filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.action, filters.targetType, filters.startDate, filters.endDate, user?.id, authLoading]);

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };
  // Show loading state while auth is loading
  if (authLoading || eventLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error if event failed to load
  if (eventError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{eventError}</AlertDescription>
        </Alert>
      </div>
    );
  }  // Show access denied if user doesn't have required permissions
  if (!user || !hasRequiredRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to view audit logs for this event.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show not found if event doesn't exist
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Event not found.</AlertDescription>
        </Alert>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Header */}
      <EventHeader event={event} userRoles={['event_admin']} />
      
      {/* Audit Log Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Event Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          View all audit logs for actions performed within this event.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{event.name}</div>
            <div className="text-sm text-muted-foreground">
              {event.organization?.name}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Event Admin</Badge>
          </CardContent>
        </Card>
      </div>      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-6">
          <AuditLogTable
            logs={auditLogs}
            pagination={pagination}
            scope="event"
            loading={loading}
            error={error || undefined}
            onFiltersChange={handleFiltersChange}
            onPageChange={handlePageChange}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
