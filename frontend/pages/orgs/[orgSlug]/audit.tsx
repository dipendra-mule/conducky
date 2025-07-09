/**
 * Organization Audit Log Viewer
 * Displays audit logs for a specific organization
 * Access: org_admin, system_admin
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { fetchOrganizationAuditLogs } from '@/lib/audit';
import { AuditLogEntry, AuditLogFilters, AuditLogPagination } from '@/types/audit';
import { Shield, Building, Users, Activity, Calendar } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export default function OrganizationAuditPage() {
  const router = useRouter();
  const { orgSlug } = router.query;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
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
  const [error, setError] = useState<string | null>(null);  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userOrgRoles, setUserOrgRoles] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);  
  // Check if user has required permissions
  const hasRequiredRole = userOrgRoles.includes('org_admin') || user?.roles?.includes('system_admin');
  // Fetch user authentication and organization data
  useEffect(() => {
    if (!orgSlug || typeof orgSlug !== 'string') return;

    const fetchAuth = async () => {
      setAuthLoading(true);
      setOrgLoading(true);
      setError(null);
      setOrgError(null);
      
      try {
        // Fetch user session
        const sessionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/session`,
          { credentials: 'include' }
        );
        const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
        setUser(sessionData ? sessionData.user : null);
        
        // Fetch organization data (includes membership info)
        const orgResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/organizations/slug/${orgSlug}`,
          { credentials: 'include' }
        );
        
        if (!orgResponse.ok) {
          if (orgResponse.status === 404) {
            setOrgError('Organization not found');
          } else if (orgResponse.status === 403) {
            setOrgError('You do not have access to this organization');
          } else {
            setOrgError('Failed to load organization');
          }
          return;
        }
        
        const orgData = await orgResponse.json();
        setOrganization(orgData.organization);
        
        // Extract user's role from membership data
        if (sessionData?.user && orgData.organization.memberships) {
          const userMembership = orgData.organization.memberships.find(
            (m: any) => m.userId === sessionData.user.id
          );
          setUserOrgRoles(userMembership ? [userMembership.role] : []);
        }
      } catch (err) {
        console.error('Error fetching auth:', err);
        setError('Failed to load organization data');
        setUser(null);
        setUserOrgRoles([]);
      } finally {
        setAuthLoading(false);
        setOrgLoading(false);
      }
    };

    fetchAuth();
  }, [orgSlug]);// Fetch audit logs
  useEffect(() => {
    if (!organization || !user || authLoading) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchOrganizationAuditLogs(organization.id, filters);
        setAuditLogs(response.logs);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [organization?.id, filters.page, filters.limit, filters.sortBy, filters.sortOrder, filters.action, filters.targetType, filters.startDate, filters.endDate, user?.id, authLoading]);

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to first page on filter change
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };
  // Show loading state while auth is loading
  if (authLoading || orgLoading) {
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

  // Show error if organization failed to load
  if (orgError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{orgError}</AlertDescription>
        </Alert>
      </div>
    );
  }
  // Show access denied if user doesn't have required permissions
  if (!user || !hasRequiredRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to view audit logs for this organization.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show not found if organization doesn't exist
  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Organization not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Organization Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {organization.logo && (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            {organization.description && (
              <p className="text-muted-foreground mt-1">{organization.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Organization</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/orgs/${organization.slug}`)}
          >
            ← Back to Organization
          </Button>
        </div>
      </div>
      
      {/* Audit Log Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Organization Audit Logs</h2>
        </div>
        <p className="text-muted-foreground">
          View all audit logs for actions performed within this organization and its events.
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
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{organization.name}</div>
            <div className="text-sm text-muted-foreground">
              All events and organization-level actions
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Organization Admin</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-6">
          <AuditLogTable
            logs={auditLogs}
            pagination={pagination}
            scope="organization"
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
