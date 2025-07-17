/**
 * Reusable audit log table component
 * Supports responsive design (table -> cards on mobile)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Filter, Search, User, Clock, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLogEntry, AuditLogFilters, AuditLogScope, AuditTargetType, TARGET_TYPE_LABELS } from '@/types/audit';
import { formatActionName, getActionColor, formatTimestamp } from '@/lib/audit';
import { cn } from '@/lib/utils';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  scope: AuditLogScope;
  loading?: boolean;
  error?: string;
  onFiltersChange: (filters: AuditLogFilters) => void;
  onPageChange: (page: number) => void;
  filters: AuditLogFilters;
}

export function AuditLogTable({
  logs,
  pagination,
  scope,
  loading = false,
  error,
  onFiltersChange,
  onPageChange,
  filters,
}: AuditLogTableProps) {
  const [searchTerm, setSearchTerm] = useState(filters.action || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, action: searchTerm || undefined });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFilterChange = (key: string, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ ...filters, sortBy: sortBy as "timestamp" | "action" | "targetType", sortOrder: newSortOrder });
  };

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search actions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
        <Select 
        value={filters.targetType || 'all'} 
        onValueChange={(value) => handleFilterChange('targetType', value === 'all' ? undefined : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filters.sortBy || 'timestamp'} onValueChange={(value) => handleFilterChange('sortBy', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="timestamp">Time</SelectItem>
          <SelectItem value="action">Action</SelectItem>
          <SelectItem value="targetType">Type</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={filters.sortOrder || 'desc'} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
        <SelectTrigger>
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest First</SelectItem>
          <SelectItem value="asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderMobileCard = (log: AuditLogEntry) => (
    <Card key={log.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className={cn('text-xs border-0', getActionColor(log.action))}
          >
            {formatActionName(log.action)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(log.timestamp)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />            <span className="text-sm">
              {TARGET_TYPE_LABELS[log.targetType as AuditTargetType] || log.targetType} ({log.targetId})
            </span>
          </div>
          
          {log.user && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {log.user.name || log.user.email}
              </span>
            </div>
          )}
          
          {scope === 'system' && log.organization && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {log.organization.name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderDesktopTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer" onClick={() => handleSortChange('timestamp')}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timestamp
              {filters.sortBy === 'timestamp' && (
                <span className="text-xs">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSortChange('action')}>
            <div className="flex items-center gap-2">
              Action
              {filters.sortBy === 'action' && (
                <span className="text-xs">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </div>
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSortChange('targetType')}>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target
              {filters.sortBy === 'targetType' && (
                <span className="text-xs">{filters.sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              User
            </div>
          </TableHead>
          {scope === 'system' && (
            <TableHead>Organization</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-mono text-sm">
              {formatTimestamp(log.timestamp)}
            </TableCell>
            <TableCell>
              <Badge 
                variant="outline" 
                className={cn('text-xs border-0', getActionColor(log.action))}
              >
                {formatActionName(log.action)}
              </Badge>
            </TableCell>
            <TableCell>              <div className="flex flex-col">
                <span className="font-medium">{TARGET_TYPE_LABELS[log.targetType as AuditTargetType] || log.targetType}</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {log.targetId}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {log.user ? (
                <div className="flex flex-col">
                  <span className="font-medium">{log.user.name || 'Unknown'}</span>
                  <span className="text-sm text-muted-foreground">
                    {log.user.email}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">System</span>
              )}
            </TableCell>
            {scope === 'system' && (
              <TableCell>
                {log.organization ? (
                  <Badge variant="outline" className="text-xs">
                    {log.organization.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
        {pagination.total} entries
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <span className="text-sm">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Audit Logs</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>
      
      {showFilters && renderFilters()}
      
      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">No audit logs found.</div>
        </div>
      )}
      
      {/* Table or cards */}
      {!loading && logs.length > 0 && (
        <>
          {isMobile ? (
            <div className="space-y-2">
              {logs.map(renderMobileCard)}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              {renderDesktopTable()}
            </div>
          )}
          
          {renderPagination()}
        </>
      )}
    </div>
  );
}
