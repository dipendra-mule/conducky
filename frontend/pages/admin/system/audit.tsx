/**
 * System Audit Log Viewer
 * Displays system-wide audit logs
 * Access: system_admin only
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { fetchSystemAuditLogs } from '@/lib/audit';
import { AuditLogEntry, AuditLogFilters, AuditLogPagination } from '@/types/audit';
import { Server, Activity, Users, Building, Calendar } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
}

export default function SystemAuditPage() {
  const router = useRouter();
  
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
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Auth guard - require system_admin role
  const { isAuthLoaded, isAuthenticated, hasRequiredRole } = useAuthGuard({
    requiredRoles: ['system_admin'],
  });

  // Fetch organizations for filtering
  useEffect(() => {
    if (!isAuthLoaded || !isAuthenticated || !hasRequiredRole) return;

    const fetchOrganizations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/organizations`,
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || []);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
      }
    };

    fetchOrganizations();
  }, [isAuthLoaded, isAuthenticated, hasRequiredRole]);

  // Fetch events for filtering
  useEffect(() => {
    if (!isAuthLoaded || !isAuthenticated || !hasRequiredRole) return;

    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/events`,
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };

    fetchEvents();
  }, [isAuthLoaded, isAuthenticated, hasRequiredRole]);
  // Fetch audit logs
  useEffect(() => {
    if (!isAuthLoaded || !isAuthenticated || !hasRequiredRole) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchSystemAuditLogs(filters);
        setAuditLogs(response.logs);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [
    filters.page,
    filters.limit,
    filters.sortBy,
    filters.sortOrder,
    filters.organizationId,
    filters.eventId,
    filters.action,
    filters.targetType,
    filters.userId,
    filters.startDate,
    filters.endDate,
    isAuthLoaded,
    isAuthenticated,
    hasRequiredRole
  ]);

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Show loading state while auth is loading
  if (!isAuthLoaded) {
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

  // Show access denied if user doesn't have required permissions
  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You must be a system administrator to view system audit logs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* System Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Server className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">System Audit Logs</h1>
        </div>
        <p className="text-muted-foreground">
          View all audit logs across the entire system. This includes all organizations, events, and system-level actions.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="destructive">System Admin Only</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/dashboard')}
          >
            ← Back to Admin Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="destructive">System Admin</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Organization</label>              <Select 
                value={filters.organizationId || 'all'} 
                onValueChange={(value) => handleFiltersChange({ ...filters, organizationId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Organizations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Event</label>              <Select 
                value={filters.eventId || 'all'} 
                onValueChange={(value) => handleFiltersChange({ ...filters, eventId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-6">
          <AuditLogTable
            logs={auditLogs}
            pagination={pagination}
            scope="system"
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
