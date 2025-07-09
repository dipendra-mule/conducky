/**
 * Tests for AuditLogTable component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { AuditLogEntry, AuditLogFilters } from '@/types/audit';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Search: () => <div data-testid="search-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
}));

// Mock UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, ...props }: any) => (
    <select 
      data-testid="select" 
      onChange={(e) => onValueChange?.(e.target.value)}
      aria-label="Select option"
      {...props}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children, ...props }: any) => (
    <div data-testid="select-content" {...props}>{children}</div>
  ),
  SelectItem: ({ children, value, ...props }: any) => (
    <option data-testid="select-item" value={value} {...props}>{children}</option>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <div data-testid="select-trigger" {...props}>{children}</div>
  ),
  SelectValue: ({ placeholder, ...props }: any) => (
    <span data-testid="select-value" {...props}>{placeholder}</span>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    action: 'create_incident',
    targetType: 'Incident',
    targetId: 'incident-1',
    userId: 'user-1',
    timestamp: '2024-01-01T12:00:00.000Z',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
  },
  {
    id: '2',
    action: 'update_incident',
    targetType: 'Incident',
    targetId: 'incident-1',
    userId: 'user-2',
    timestamp: '2024-01-01T13:00:00.000Z',
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
  },
];

const mockPagination = {
  page: 1,
  limit: 25,
  total: 2,
  totalPages: 1,
};

const mockFilters: AuditLogFilters = {
  page: 1,
  limit: 25,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

describe('AuditLogTable', () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders audit logs correctly', () => {
    render(
      <AuditLogTable
        logs={mockAuditLogs}
        pagination={mockPagination}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('Create Incident')).toBeInTheDocument();
    expect(screen.getByText('Update Incident')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
  it('displays loading state', () => {
    render(
      <AuditLogTable
        logs={[]}
        pagination={mockPagination}
        scope="event"
        loading={true}
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    // Should show loading skeleton elements
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    // Check for skeleton elements by class
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements).toHaveLength(5);
  });

  it('displays error state', () => {
    render(
      <AuditLogTable
        logs={[]}
        pagination={mockPagination}
        scope="event"
        error="Failed to load audit logs"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('Failed to load audit logs')).toBeInTheDocument();
  });

  it('displays empty state', () => {
    render(
      <AuditLogTable
        logs={[]}
        pagination={{ ...mockPagination, total: 0 }}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('No audit logs found.')).toBeInTheDocument();
  });
  it('handles filter changes', async () => {
    render(
      <AuditLogTable
        logs={mockAuditLogs}
        pagination={mockPagination}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    // Click filters button
    fireEvent.click(screen.getByText('Filters'));

    // Wait for filters to show
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search actions...')).toBeInTheDocument();
    });

    // Find and interact with search input
    const searchInput = screen.getByPlaceholderText('Search actions...');
    fireEvent.change(searchInput, { target: { value: 'create' } });

    // Wait for debounced filter change
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        action: 'create',
      });
    }, { timeout: 500 });
  });

  it('handles pagination', () => {
    const paginationWithMultiplePages = {
      ...mockPagination,
      total: 50,
      totalPages: 2,
    };

    render(
      <AuditLogTable
        logs={mockAuditLogs}
        pagination={paginationWithMultiplePages}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    // Click next page
    fireEvent.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles sorting', () => {
    render(
      <AuditLogTable
        logs={mockAuditLogs}
        pagination={mockPagination}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    // Click on Action column header to sort
    fireEvent.click(screen.getByText('Action'));
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      sortBy: 'action',
      sortOrder: 'desc',
    });
  });
  it('shows organization column in system scope', () => {
    const systemScopeLogs = mockAuditLogs.map(log => ({
      ...log,
      organization: { id: 'org-1', name: 'Test Organization' },
    }));

    render(
      <AuditLogTable
        logs={systemScopeLogs}
        pagination={mockPagination}
        scope="system"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getAllByText('Test Organization')).toHaveLength(2); // Should appear twice for 2 logs
  });

  it('adapts to mobile view', () => {
    // Mock mobile screen width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <AuditLogTable
        logs={mockAuditLogs}
        pagination={mockPagination}
        scope="event"
        onFiltersChange={mockOnFiltersChange}
        onPageChange={mockOnPageChange}
        filters={mockFilters}
      />
    );

    // Should render cards instead of table on mobile
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    
    // Should still show the audit log data
    expect(screen.getByText('Create Incident')).toBeInTheDocument();
    expect(screen.getByText('Update Incident')).toBeInTheDocument();
  });
});
