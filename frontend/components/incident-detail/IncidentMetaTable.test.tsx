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

jest.mock('./ContactPreferenceEditForm', () => ({
  ContactPreferenceEditForm: ({ onSave, onCancel }: { onSave: (value: string) => void; onCancel: () => void }) => (
    <div data-testid="contact-preference-edit-form">
      <button onClick={() => onSave('phone')}>Save Contact</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe('IncidentMetaTable', () => {
  const defaultProps = {
    id: 'report-123',
    type: 'harassment',
    description: 'Test report description',
    reporter: { name: 'John Doe', email: 'john@example.com' },
    location: 'Main conference room',
    contactPreference: 'email',
    incidentAt: '2024-01-15T10:00:00Z',
    parties: 'John Doe, Jane Smith',
    canEditLocation: false,
    canEditContactPreference: false,
    canEditIncidentAt: false,
    canEditParties: false,
    canEditDescription: false,
    canEditType: false
  };

  it('renders all report metadata fields', () => {
    render(<IncidentMetaTable {...defaultProps} />);

    expect(screen.getByText('Incident ID')).toBeInTheDocument();
    expect(screen.getByText('report-123')).toBeInTheDocument();
    
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Harassment')).toBeInTheDocument();
    
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Main conference room')).toBeInTheDocument();
    
    expect(screen.getByText('Contact Preference')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    
    expect(screen.getByText('Incident Date')).toBeInTheDocument();
    // Date format will be locale-specific, just check it exists
    
    expect(screen.getByText('Parties Involved')).toBeInTheDocument();
    expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument();
  });

  it('shows "Not specified" for missing optional fields when editing is enabled', () => {
    const propsWithMissingFields = {
      ...defaultProps,
      location: null,
      incidentAt: null,
      parties: null,
      canEditLocation: true,
      canEditIncidentAt: true,
      canEditParties: true
    };

    render(<IncidentMetaTable {...propsWithMissingFields} />);

    const notSpecifiedElements = screen.getAllByText('Not specified');
    expect(notSpecifiedElements).toHaveLength(3); // location, incidentAt, parties
  });

  it('formats contact preferences correctly', () => {
    const testCases = [
      { preference: 'email', expected: 'Email' },
      { preference: 'phone', expected: 'Phone' },
      { preference: 'in_person', expected: 'In Person' },
      { preference: 'no_contact', expected: 'No Contact Preferred' }
    ];

    testCases.forEach(({ preference, expected }) => {
      const { rerender } = render(
        <IncidentMetaTable {...defaultProps} contactPreference={preference} />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      
      // Clean up for next iteration
      rerender(<div />);
    });
  });

  it('shows edit buttons when user has edit permissions', () => {
    const propsWithEditPermissions = {
      ...defaultProps,
      canEditLocation: true,
      canEditContactPreference: true,
      canEditIncidentAt: true,
      canEditParties: true,
      canEditDescription: true,
      canEditType: true
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