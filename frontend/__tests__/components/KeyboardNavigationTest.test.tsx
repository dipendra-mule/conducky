import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();

// Test component that uses keyboard shortcuts
function TestComponent() {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState('');
  
  useKeyboardShortcuts({
    enabled: true,
    onQuickJumpOpen: jest.fn(),
    onQuickIncidentOpen: jest.fn(),
  });

  return (
    <div>
      <h1>Test Component</h1>
      
      {/* Dropdown menu that should handle its own keyboard navigation */}
      <div role="menu" style={{ display: dropdownOpen ? 'block' : 'none' }}>
        <button 
          role="menuitem" 
          onClick={() => setSelectedOption('option1')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSelectedOption('option1');
              setDropdownOpen(false);
            }
          }}
        >
          Option 1
        </button>
        <button 
          role="menuitem" 
          onClick={() => setSelectedOption('option2')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSelectedOption('option2');
              setDropdownOpen(false);
            }
          }}
        >
          Option 2
        </button>
      </div>
      
      <button onClick={() => setDropdownOpen(!dropdownOpen)}>
        Toggle Dropdown
      </button>
      
      <div data-testid="selected-option">{selectedOption}</div>
    </div>
  );
}

describe('Keyboard Navigation Fixes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockRouter = {
      push: mockPush,
      back: mockBack,
      pathname: '/test',
      query: {},
    };
    (useRouter as jest.MockedFunction<typeof useRouter>).mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  it('allows keyboard navigation within dropdown menus', () => {
    render(<TestComponent />);
    
    // Open dropdown
    fireEvent.click(screen.getByText('Toggle Dropdown'));
    
    // Focus on first menu item
    const option1 = screen.getByText('Option 1');
    option1.focus();
    
    // Press Enter - should select option and NOT trigger keyboard shortcut
    fireEvent.keyDown(option1, { key: 'Enter' });
    
    expect(screen.getByTestId('selected-option')).toHaveTextContent('option1');
    expect(mockPush).not.toHaveBeenCalled(); // Keyboard shortcut should not have triggered
  });

  it('prevents keyboard shortcuts when inside dropdown menus', () => {
    render(<TestComponent />);
    
    // Open dropdown
    fireEvent.click(screen.getByText('Toggle Dropdown'));
    
    // Focus on first menu item
    const option1 = screen.getByText('Option 1');
    option1.focus();
    
    // Press 'n' key - should NOT trigger notifications shortcut
    fireEvent.keyDown(option1, { key: 'n' });
    
    expect(mockPush).not.toHaveBeenCalledWith('/dashboard/notifications');
  });

  it('still allows keyboard shortcuts outside of dropdown menus', () => {
    render(<TestComponent />);
    
    // Focus on main container (not in dropdown)
    const heading = screen.getByText('Test Component');
    heading.focus();
    
    // Press 'n' key - should trigger notifications shortcut
    fireEvent.keyDown(document.body, { key: 'n' });
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard/notifications');
  });

  it('handles Escape key appropriately when dropdown is open', () => {
    render(<TestComponent />);
    
    // Open dropdown
    fireEvent.click(screen.getByText('Toggle Dropdown'));
    
    // Add data-state="open" to simulate Radix UI dropdown
    const dropdown = screen.getByRole('menu');
    dropdown.setAttribute('data-state', 'open');
    
    // Focus on menu item
    const option1 = screen.getByText('Option 1');
    option1.focus();
    
    // Press Escape - should NOT trigger router.back() since dropdown is open
    fireEvent.keyDown(option1, { key: 'Escape' });
    
    expect(mockBack).not.toHaveBeenCalled();
  });
}); 