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
    it('should return green for create actions', () => {
      expect(getActionColor('create_incident')).toBe('text-green-600');
      expect(getActionColor('create_user')).toBe('text-green-600');
    });

    it('should return blue for update actions', () => {
      expect(getActionColor('update_incident')).toBe('text-blue-600');
      expect(getActionColor('update_user')).toBe('text-blue-600');
    });

    it('should return red for delete actions', () => {
      expect(getActionColor('delete_incident')).toBe('text-red-600');
      expect(getActionColor('delete_comment')).toBe('text-red-600');
    });

    it('should return purple for resolve actions', () => {
      expect(getActionColor('resolve_incident')).toBe('text-purple-600');
    });

    it('should return gray for close actions', () => {
      expect(getActionColor('close_incident')).toBe('text-gray-600');
    });

    it('should return indigo for login actions', () => {
      expect(getActionColor('login_successful')).toBe('text-indigo-600');
      expect(getActionColor('login_failed')).toBe('text-indigo-600');
    });

    it('should return default gray for unknown actions', () => {
      expect(getActionColor('unknown_action')).toBe('text-gray-700');
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
