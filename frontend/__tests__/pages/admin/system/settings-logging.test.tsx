import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SystemSettings from '../../../../pages/admin/system/settings';
import { UserContext } from '../../../../pages/_app';

// Mock the Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    asPath: '/admin/system/settings',
  }),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SystemSettings - Logging Configuration', () => {
  const mockUser = {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    isSystemAdmin: true,
    globalRoles: ['SuperAdmin']
  };

  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <UserContext.Provider value={{ user: mockUser, setUser: jest.fn(), sessionLoading: false }}>
        {component}
      </UserContext.Provider>
    );
  };

  const mockSuccessfulSettingsResponse = {
    settings: {
      logging: {
        level: 'info',
        destinations: {
          console: true,
          file: true,
          errorFile: false
        },
        filePath: 'logs/combined.log',
        errorFilePath: 'logs/error.log'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for settings fetch
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulSettingsResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders logging configuration section', async () => {
    renderWithContext(<SystemSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Check for logging configuration title
    expect(screen.getByText('Logging Configuration')).toBeInTheDocument();
    expect(screen.getByText('Configure system logging levels and destinations for debugging and monitoring.')).toBeInTheDocument();
  });

  it('displays log level dropdown with current value', async () => {
    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Check for log level label
    expect(screen.getByText('Log Level')).toBeInTheDocument();
    
    // Find the log level dropdown and verify it shows the current selection
    const comboboxes = screen.getAllByRole('combobox');
    const logLevelTrigger = comboboxes.find(cb => 
      cb.textContent?.includes('Info - General info, warnings, and errors')
    );
    expect(logLevelTrigger).toBeDefined();
    expect(logLevelTrigger).toHaveTextContent('Info - General info, warnings, and errors (recommended for production)');
  });

  it('displays logging destination toggles', async () => {
    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Check for destination toggles
    expect(screen.getByText('Log Destinations')).toBeInTheDocument();
    expect(screen.getByText('Console Output')).toBeInTheDocument();
    expect(screen.getByText('Log File')).toBeInTheDocument();
    expect(screen.getByText('Error Log File')).toBeInTheDocument();
  });

  it('displays file path inputs', async () => {
    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Check for file path inputs
    expect(screen.getByLabelText('Log File Path')).toBeInTheDocument();
    expect(screen.getByLabelText('Error Log File Path')).toBeInTheDocument();
    
    // Check default values are displayed
    expect(screen.getByDisplayValue('logs/combined.log')).toBeInTheDocument();
    expect(screen.getByDisplayValue('logs/error.log')).toBeInTheDocument();
  });

  it('shows save logging settings button', async () => {
    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Save Logging Settings' })).toBeInTheDocument();
  });

  it('updates file path input values', async () => {
    const user = userEvent.setup();
    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Find the log file path input
    const logFileInput = screen.getByLabelText('Log File Path');
    
    // Clear and type new value
    await user.clear(logFileInput);
    await user.type(logFileInput, 'logs/app.log');

    expect(logFileInput).toHaveValue('logs/app.log');
  });

  it('submits logging settings when save button is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock successful save response
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/admin/system/logging') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulSettingsResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByRole('button', { name: 'Save Logging Settings' });
    await user.click(saveButton);

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/system/logging'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: expect.stringContaining('"level":"info"'),
        })
      );
    });
  });

  it('displays success message after successful save', async () => {
    const user = userEvent.setup();
    
    // Mock successful save response
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/admin/system/logging') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulSettingsResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByRole('button', { name: 'Save Logging Settings' });
    await user.click(saveButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Logging settings updated successfully')).toBeInTheDocument();
    });
  });

  it('displays error message when save fails', async () => {
    const user = userEvent.setup();
    
    // Mock failed save response
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/api/admin/system/logging') && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to update logging settings' }),
        });
      }
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSuccessfulSettingsResponse),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    renderWithContext(<SystemSettings />);

    await waitFor(() => {
      expect(screen.queryByText('Loading system settings...')).not.toBeInTheDocument();
    });

    // Click save button
    const saveButton = screen.getByRole('button', { name: 'Save Logging Settings' });
    await user.click(saveButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to update logging settings')).toBeInTheDocument();
    });
  });
}); 