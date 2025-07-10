import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IncidentMetaTable } from './IncidentMetaTable';

// Mock the edit form components
jest.mock('./LocationEditForm', () => ({
  LocationEditForm: ({ onSave, onCancel }: { onSave: (value: string) => void; onCancel: () => void }) => (
    <div data-testid="location-edit-form">
      <button onClick={() => onSave('New location')}>Save Location</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe('IncidentMetaTable', () => {
  const defaultProps = {
    id: 'report-123',
    description: 'Test report description',
    reporter: { name: 'John Doe', email: 'john@example.com' },
    location: 'Main conference room',
    incidentAt: '2024-01-15T10:00:00Z',
    parties: 'John Doe, Jane Smith',
    userRoles: ['responder'], // Add default role for testing
    canEditLocation: false,
    canEditIncidentAt: false,
    canEditParties: false,
    canEditDescription: false
  };

  it('renders all report metadata fields', () => {
    render(<IncidentMetaTable {...defaultProps} />);

    expect(screen.getByText('Incident ID')).toBeInTheDocument();
    expect(screen.getByText('report-123')).toBeInTheDocument();
    
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Test report description')).toBeInTheDocument();
    
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Main conference room')).toBeInTheDocument();
    
    expect(screen.getByText('Incident Date')).toBeInTheDocument();
    // Date format will be locale-specific, just check it exists
    
    expect(screen.getByText('Parties Involved')).toBeInTheDocument();
    expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
  });

  it('renders event name when provided', () => {
    const propsWithEvent = {
      ...defaultProps,
      eventName: 'Test Event 2024'
    };

    render(<IncidentMetaTable {...propsWithEvent} />);

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2024')).toBeInTheDocument();
  });

  it('renders tags when provided', () => {
    const propsWithTags = {
      ...defaultProps,
      tags: [
        { id: '1', name: 'Harassment', color: '#ef4444' },
        { id: '2', name: 'Safety', color: '#f97316' }
      ]
    };

    render(<IncidentMetaTable {...propsWithTags} />);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
    expect(screen.getByText('Safety')).toBeInTheDocument();
  });

  it('does not render event section when not provided', () => {
    render(<IncidentMetaTable {...defaultProps} />);

    expect(screen.queryByText('Event')).not.toBeInTheDocument();
    // Tags section is always rendered now for editing capability
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('shows "Not specified" for missing optional fields', () => {
    const propsWithMissingFields = {
      ...defaultProps,
      location: null,
      incidentAt: null,
      parties: null,
      userRoles: ['responder'] // Add responder role for visibility
    };

    render(<IncidentMetaTable {...propsWithMissingFields} />);

    const notSpecifiedElements = screen.getAllByText('Not specified');
    expect(notSpecifiedElements).toHaveLength(3); // location, incidentAt, parties
  });

  it('shows edit buttons when user has edit permissions', () => {
    const propsWithEditPermissions = {
      ...defaultProps,
      canEditLocation: true,
      canEditIncidentAt: true,
      canEditParties: true,
      canEditDescription: true
    };

    render(<IncidentMetaTable {...propsWithEditPermissions} />);

    // Should show edit buttons (pencil icons) for editable fields
    const editButtons = screen.getAllByRole('button');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('does not show edit buttons when user lacks edit permissions', () => {
    render(<IncidentMetaTable {...defaultProps} />);

    // Should not show any edit buttons since all permissions are false
    const editButtons = screen.queryAllByRole('button');
    expect(editButtons).toHaveLength(0);
  });

  it('opens location edit form when edit button is clicked', async () => {
    const propsWithLocationEdit = {
      ...defaultProps,
      canEditLocation: true,
      onLocationEdit: jest.fn()
    };

    render(<IncidentMetaTable {...propsWithLocationEdit} />);

    // Find and click the edit button for location
    const editButtons = screen.getAllByRole('button');
    
    await act(async () => {
      fireEvent.click(editButtons[0]); // Assuming first button is for location
    });

    expect(screen.getByTestId('location-edit-form')).toBeInTheDocument();
  });

  it('calls onLocationEdit when location is saved', async () => {
    const mockOnLocationEdit = jest.fn().mockResolvedValue(undefined);
    const propsWithLocationEdit = {
      ...defaultProps,
      canEditLocation: true,
      onLocationEdit: mockOnLocationEdit
    };

    render(<IncidentMetaTable {...propsWithLocationEdit} />);

    // Open edit form
    const editButtons = screen.getAllByRole('button');
    
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });

    // Save new location
    const saveButton = screen.getByText('Save Location');
    
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockOnLocationEdit).toHaveBeenCalledWith('New location');
  });

  it('closes edit form when cancel is clicked', async () => {
    const propsWithLocationEdit = {
      ...defaultProps,
      canEditLocation: true,
      onLocationEdit: jest.fn()
    };

    render(<IncidentMetaTable {...propsWithLocationEdit} />);

    // Open edit form
    const editButtons = screen.getAllByRole('button');
    
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByTestId('location-edit-form')).toBeInTheDocument();

    // Cancel editing
    const cancelButton = screen.getByText('Cancel');
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(screen.queryByTestId('location-edit-form')).not.toBeInTheDocument();
  });
}); 