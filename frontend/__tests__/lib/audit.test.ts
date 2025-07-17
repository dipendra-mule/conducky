/**
 * Tests for audit log utilities
 */

import { 
  formatActionName, 
  getActionColor, 
  formatTimestamp 
} from '@/lib/audit';

describe('audit utilities', () => {
  describe('formatActionName', () => {
    it('should format snake_case actions to title case', () => {
      expect(formatActionName('create_incident')).toBe('Create Incident');
      expect(formatActionName('update_user_role')).toBe('Update User Role');
      expect(formatActionName('delete_comment')).toBe('Delete Comment');
      expect(formatActionName('login_successful')).toBe('Login Successful');
    });

    it('should handle single word actions', () => {
      expect(formatActionName('login')).toBe('Login');
      expect(formatActionName('logout')).toBe('Logout');
    });

    it('should handle empty strings', () => {
      expect(formatActionName('')).toBe('');
    });
  });

  describe('getActionColor', () => {
    it('should return green styling for create actions', () => {
      expect(getActionColor('create_incident')).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200');
      expect(getActionColor('create_user')).toBe('bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200');
    });

    it('should return blue styling for update actions', () => {
      expect(getActionColor('update_incident')).toBe('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200');
      expect(getActionColor('update_user')).toBe('bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200');
    });

    it('should return red styling for delete actions', () => {
      expect(getActionColor('delete_incident')).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200');
      expect(getActionColor('delete_comment')).toBe('bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200');
    });

    it('should return purple styling for resolve actions', () => {
      expect(getActionColor('resolve_incident')).toBe('bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200');
    });

    it('should return gray styling for close actions', () => {
      expect(getActionColor('close_incident')).toBe('bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200');
    });

    it('should return indigo styling for login actions', () => {
      expect(getActionColor('login_successful')).toBe('bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200');
      expect(getActionColor('login_failed')).toBe('bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200');
    });

    it('should return default gray styling for unknown actions', () => {
      expect(getActionColor('unknown_action')).toBe('bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300');
    });
  });
  describe('formatTimestamp', () => {
    it('should format timestamps correctly', () => {
      const timestamp = '2024-01-01T12:30:45.000Z';
      const formatted = formatTimestamp(timestamp);
      
      // Check that it includes the expected parts (account for timezone differences)
      expect(formatted).toMatch(/Jan/);
      expect(formatted).toMatch(/1,/);
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/30:45/); // Just check minutes and seconds
    });

    it('should handle different timestamp formats', () => {
      const timestamp = '2024-12-25T23:59:59.999Z';
      const formatted = formatTimestamp(timestamp);
      
      expect(formatted).toMatch(/Dec/);
      expect(formatted).toMatch(/25,/);
      expect(formatted).toMatch(/2024/);
      expect(formatted).toMatch(/59:59/); // Just check minutes and seconds
    });
  });
});
