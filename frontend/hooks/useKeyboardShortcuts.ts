import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  onQuickJumpOpen?: () => void;
  onQuickIncidentOpen?: () => void;
  enabled?: boolean;
  enableSwipeNavigation?: boolean;
  userEvents?: Array<{ slug: string; name: string; }>;
}

export function useKeyboardShortcuts({ 
  onQuickJumpOpen, 
  onQuickIncidentOpen,
  enabled = true,
  enableSwipeNavigation = true,
  userEvents = []
}: UseKeyboardShortcutsProps = {}) {
  const router = useRouter();

  const handleQuickIncident = useCallback(() => {
    if (userEvents.length === 0) {
      // No events - could show a message or do nothing
      return;
    } else if (userEvents.length === 1) {
      // Single event - navigate directly
      router.push(`/events/${userEvents[0].slug}/incidents/new`);
    } else {
      // Multiple events - open quick jump with "new report" query
      onQuickIncidentOpen?.();
    }
  }, [userEvents, router, onQuickIncidentOpen]);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => onQuickJumpOpen?.(),
      description: 'Open quick jump'
    },
    {
      key: 'k',
      metaKey: true, // For Mac users
      action: () => onQuickJumpOpen?.(),
      description: 'Open quick jump'
    },
    {
      key: '/',
      action: () => onQuickJumpOpen?.(),
      description: 'Open quick jump'
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      action: () => handleQuickIncident(),
      description: userEvents.length === 1 
        ? `Submit report for ${userEvents[0]?.name || 'event'}` 
        : 'Quick submit incident'
    },
    {
      key: 'r',
      metaKey: true, // For Mac users
      shiftKey: true,
      action: () => handleQuickIncident(),
      description: userEvents.length === 1 
        ? `Submit report for ${userEvents[0]?.name || 'event'}` 
        : 'Quick submit incident'
    },
    {
      key: 'h',
      action: () => router.push('/dashboard'),
      description: 'Go to dashboard'
    },
    {
      key: 'r',
      action: () => router.push('/dashboard/incidents'),
      description: 'Go to all incidents'
    },
    {
      key: 'n',
      action: () => router.push('/dashboard/notifications'),
      description: 'Go to notifications'
    },
    {
      key: 'p',
      action: () => router.push('/profile'),
      description: 'Go to profile'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or go back
        if (window.history.length > 1) {
          router.back();
        }
      },
      description: 'Go back or close'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return;
    }

    // Enhanced exclusions for UI navigation elements
    // Don't trigger shortcuts when user is navigating dropdowns, menus, or other interactive elements
    if (
      // Dropdown menus and select components
      target.closest('[role="menu"]') ||
      target.closest('[role="menubar"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="listbox"]') ||
      target.closest('[role="option"]') ||
      target.closest('[role="combobox"]') ||
      target.closest('.dropdown-menu') ||
      target.closest('[data-radix-collection-item]') || // Radix UI components
      target.closest('[data-select-trigger]') ||
      target.closest('[data-select-content]') ||
      
      // Modal dialogs and overlays
      target.closest('[role="dialog"]') ||
      target.closest('[role="alertdialog"]') ||
      target.closest('.modal') ||
      target.closest('[data-dialog-content]') ||
      
      // Navigation elements that should handle their own keyboard navigation
      target.closest('[role="navigation"]') ||
      target.closest('nav') ||
      target.closest('[role="tabpanel"]') ||
      target.closest('[role="tablist"]') ||
      
      // Any element with specific keyboard navigation handling
      target.closest('[data-keyboard-navigation]') ||
      target.hasAttribute('tabindex') ||
      
      // Buttons and links that might be part of dropdown menus
      (target.tagName === 'BUTTON' && target.closest('[role="menu"]')) ||
      (target.tagName === 'A' && target.closest('[role="menu"]'))
    ) {
      return;
    }

    // Special handling for Escape key - should only work for modifiers or when no UI elements are open
    if (event.key === 'Escape') {
      // Check if any dropdowns, modals, or menus are currently open
      const hasOpenDropdown = document.querySelector('[data-state="open"]') ||
                             document.querySelector('.dropdown-menu[data-state="open"]') ||
                             document.querySelector('[role="menu"]:not([hidden])') ||
                             document.querySelector('[role="dialog"]:not([hidden])');
      
      if (hasOpenDropdown) {
        // Let the UI component handle the Escape key
        return;
      }
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = s.ctrlKey ? event.ctrlKey : true; // If not required, always match
      const metaMatch = s.metaKey ? event.metaKey : true; // If not required, always match
      const shiftMatch = s.shiftKey ? event.shiftKey : true; // If not required, always match
      
      // Also ensure that if modifier is not required, it's not pressed (unless it's required by another shortcut)
      const noExtraCtrl = s.ctrlKey || !event.ctrlKey;
      const noExtraMeta = s.metaKey || !event.metaKey;
      const noExtraShift = s.shiftKey || !event.shiftKey;
      
      return keyMatch && ctrlMatch && metaMatch && shiftMatch && noExtraCtrl && noExtraMeta && noExtraShift;
    });

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
    }
  }, [shortcuts, onQuickJumpOpen, router, handleQuickIncident]);

  // Swipe navigation for mobile
  useEffect(() => {
    if (!enableSwipeNavigation || typeof window === 'undefined') return;

    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 100;
      
      // Only trigger if horizontal swipe is longer than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
        // Don't interfere with input elements
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('input') ||
          target.closest('textarea')
        ) {
          return;
        }

        if (deltaX > 0) {
          // Swipe right - go back
          if (window.history.length > 1) {
            router.back();
          }
        }
        // Note: Swipe left for forward navigation could be added here if needed
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableSwipeNavigation, router]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      ctrlKey: s.ctrlKey,
      metaKey: s.metaKey,
      shiftKey: s.shiftKey,
      description: s.description
    }))
  };
} 