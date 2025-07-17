import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import SystemSettings from '../../../../pages/admin/system/settings';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// Mock useAuth hook
jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: 'admin@test.com',
      name: 'Admin User',
      isSystemAdmin: true,
    },
    loading: false,
  }),
}));

describe('SystemSettings - Logging Configuration', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.MockedFunction<typeof useRouter>).mockReturnValue({
      push: mockPush,
      pathname: '/admin/system/settings',
    });
    
    // Default successful fetch responses
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation((url: string) => {
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            settings: {
              logging: {
                level: 'info',
                destinations: {
                  console: true,
                  file: true,
                  errorFile: true,
                },
                filePath: 'logs/combined.log',
                errorFilePath: 'logs/error.log',
              },
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render logging configuration section', async () => {
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByText('Logging Configuration')).toBeInTheDocument();
    });

    expect(screen.getByText('Configure system logging levels and destinations for debugging and monitoring.')).toBeInTheDocument();
    expect(screen.getByLabelText('Log Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Console Logging')).toBeInTheDocument();
    expect(screen.getByLabelText('File Logging')).toBeInTheDocument();
    expect(screen.getByLabelText('Error File Logging')).toBeInTheDocument();
    expect(screen.getByLabelText('Log File Path')).toBeInTheDocument();
    expect(screen.getByLabelText('Error Log File Path')).toBeInTheDocument();
  });

  it('should load and display current logging settings', async () => {
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('info')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('logs/combined.log')).toBeInTheDocument();
    expect(screen.getByDisplayValue('logs/error.log')).toBeInTheDocument();
    
    // Check that checkboxes are checked based on settings
    const consoleCheckbox = screen.getByLabelText('Console Logging') as HTMLInputElement;
    const fileCheckbox = screen.getByLabelText('File Logging') as HTMLInputElement;
    const errorFileCheckbox = screen.getByLabelText('Error File Logging') as HTMLInputElement;
    
    expect(consoleCheckbox.checked).toBe(true);
    expect(fileCheckbox.checked).toBe(true);
    expect(errorFileCheckbox.checked).toBe(true);
  });

  it('should allow changing log level', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('info')).toBeInTheDocument();
    });

    // Click on the log level select
    const logLevelSelect = screen.getByLabelText('Log Level');
    await user.click(logLevelSelect);

    // Find and click debug option
    await waitFor(() => {
      const debugOption = screen.getByText('debug');
      expect(debugOption).toBeInTheDocument();
    });

    const debugOption = screen.getByText('debug');
    await user.click(debugOption);

    // Verify the value changed
    await waitFor(() => {
      expect(screen.getByDisplayValue('debug')).toBeInTheDocument();
    });
  });

  it('should allow toggling destination checkboxes', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Console Logging')).toBeInTheDocument();
    });

    const consoleCheckbox = screen.getByLabelText('Console Logging') as HTMLInputElement;
    
    // Initially checked
    expect(consoleCheckbox.checked).toBe(true);

    // Toggle it off
    await user.click(consoleCheckbox);
    expect(consoleCheckbox.checked).toBe(false);

    // Toggle it back on
    await user.click(consoleCheckbox);
    expect(consoleCheckbox.checked).toBe(true);
  });

  it('should allow editing file paths', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('logs/combined.log')).toBeInTheDocument();
    });

    const filePathInput = screen.getByLabelText('Log File Path');
    
    // Clear and type new path
    await user.clear(filePathInput);
    await user.type(filePathInput, 'custom/app.log');

    expect(screen.getByDisplayValue('custom/app.log')).toBeInTheDocument();
  });

  it('should save logging settings when update button is clicked', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.Mock;

    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByText('Update Logging Settings')).toBeInTheDocument();
    });

    // Make some changes
    const logLevelSelect = screen.getByLabelText('Log Level');
    await user.click(logLevelSelect);
    
    await waitFor(() => {
      const warnOption = screen.getByText('warn');
      expect(warnOption).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('warn'));

    // Mock successful update response
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          message: 'Logging settings updated successfully',
        }),
      })
    );

    // Click update button
    const updateButton = screen.getByText('Update Logging Settings');
    await user.click(updateButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Logging settings updated successfully/)).toBeInTheDocument();
    });

    // Verify API was called with correct data
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/system/logging'),
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: expect.stringContaining('warn'),
      })
    );
  });

  it('should show error message when update fails', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.Mock;

    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByText('Update Logging Settings')).toBeInTheDocument();
    });

    // Mock failed update response
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid log level provided',
        }),
      })
    );

    // Click update button
    const updateButton = screen.getByText('Update Logging Settings');
    await user.click(updateButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid log level provided/)).toBeInTheDocument();
    });
  });

  it('should show loading state during update', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.Mock;

    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByText('Update Logging Settings')).toBeInTheDocument();
    });

    // Mock slow response
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' }),
        }), 100)
      )
    );

    const updateButton = screen.getByText('Update Logging Settings');
    await user.click(updateButton);

    // Should show loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('should validate required file paths', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('logs/combined.log')).toBeInTheDocument();
    });

    // Clear file path
    const filePathInput = screen.getByLabelText('Log File Path');
    await user.clear(filePathInput);

    // Try to update with empty path
    const updateButton = screen.getByText('Update Logging Settings');
    await user.click(updateButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/File path is required/)).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.Mock;

    render(<SystemSettings />);

    await waitFor(() => {
      expect(screen.getByText('Update Logging Settings')).toBeInTheDocument();
    });

    // Mock network error
    mockFetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    const updateButton = screen.getByText('Update Logging Settings');
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to update logging settings/)).toBeInTheDocument();
    });
  });

  it('should handle missing logging settings in response', async () => {
    // Mock response without logging settings
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/system/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            settings: {
              // No logging settings
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<SystemSettings />);

    // Should render with default values
    await waitFor(() => {
      expect(screen.getByText('Logging Configuration')).toBeInTheDocument();
    });

    // Should have default log level
    expect(screen.getByDisplayValue('info')).toBeInTheDocument();
  });
}); 