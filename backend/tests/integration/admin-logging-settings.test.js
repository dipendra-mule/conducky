// Mock the RBAC middleware - needs to be at the top level before imports
jest.mock('../../src/utils/rbac', () => ({
  requireSystemAdmin: () => (req, res, next) => {
    const { inMemoryStore } = require('../../__mocks__/@prisma/client');
    
    // Use test user ID from header if provided
    const testUserId = req.headers['x-test-user-id'];
    
    // If no test user ID provided, treat as unauthenticated
    if (!testUserId) {
      req.isAuthenticated = () => false;
      return res.status(403).json({ error: 'Authentication required' });
    }
    
    req.isAuthenticated = () => true;
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Check if user has system admin role
    const hasSystemAdminRole = inMemoryStore.userRoles?.some(ur => {
      return ur.userId === testUserId && 
             ur.role?.name === 'system_admin' && 
             ur.scopeType === 'system';
    });
    
    if (!hasSystemAdminRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  },
  requireRole: (allowedRoles) => (req, res, next) => {
    const { inMemoryStore } = require('../../__mocks__/@prisma/client');
    
    // Use test user ID from header if provided
    const testUserId = req.headers['x-test-user-id'];
    
    // If no test user ID provided, treat as unauthenticated
    if (!testUserId) {
      req.isAuthenticated = () => false;
      return res.status(403).json({ error: 'Authentication required' });
    }
    
    req.isAuthenticated = () => true;
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // For simplicity in this test, just allow all operations
    next();
  }
}));

const request = require('supertest');
const app = require('../../index');
const { inMemoryStore } = require('../../__mocks__/@prisma/client');

describe('Admin Logging Settings API', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Setup test users
    const mockUsers = [
      { id: '1', email: 'superadmin@test.com', name: 'Super Admin' },
      { id: '2', email: 'user@test.com', name: 'Regular User' }
    ];

    // Setup unified RBAC roles
    const mockUserRoles = [
      // System Admin user
      { 
        id: '1', 
        userId: '1', 
        roleId: '1', 
        scopeType: 'system', 
        scopeId: 'SYSTEM', 
        grantedAt: new Date(), 
        role: { id: '1', name: 'system_admin' } 
      }
      // User '2' has no system admin role (regular user)
    ];

    // Setup system settings
    const mockSystemSettings = [];

    // Setup in-memory store
    inMemoryStore.users = mockUsers;
    inMemoryStore.userRoles = mockUserRoles;
    inMemoryStore.systemSettings = mockSystemSettings;
  });

  describe('GET /api/admin/system/logging', () => {
    it('should return current logging settings for super admin', async () => {
      // Seed some test logging settings
      inMemoryStore.systemSettings = [
        { key: 'logLevel', value: 'debug' },
        { key: 'logDestinations', value: JSON.stringify({ console: true, file: false, errorFile: true }) },
        { key: 'logFilePath', value: 'test/combined.log' },
        { key: 'logErrorFilePath', value: 'test/error.log' }
      ];

      const response = await request(app)
        .get('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .expect(200);

      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toEqual({
        level: 'debug',
        destinations: { console: true, file: false, errorFile: true },
        filePath: 'test/combined.log',
        errorFilePath: 'test/error.log'
      });

      expect(response.body).toHaveProperty('options');
      expect(response.body.options).toHaveProperty('levels');
      expect(response.body.options.levels).toContain('error');
      expect(response.body.options.levels).toContain('warn');
      expect(response.body.options.levels).toContain('info');
      expect(response.body.options.levels).toContain('debug');

      expect(response.body.options).toHaveProperty('destinations');
      expect(response.body.options.destinations).toEqual([
        { key: 'console', label: 'Console Output' },
        { key: 'file', label: 'Log File' },
        { key: 'errorFile', label: 'Error Log File' }
      ]);
    });

    it('should return default settings when no settings exist', async () => {
      const response = await request(app)
        .get('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .expect(200);

      expect(response.body.settings).toHaveProperty('level');
      expect(response.body.settings).toHaveProperty('destinations');
      expect(response.body.settings).toHaveProperty('filePath');
      expect(response.body.settings).toHaveProperty('errorFilePath');
    });

    it('should deny access to regular users', async () => {
      await request(app)
        .get('/api/admin/system/logging')
        .set('x-test-user-id', '2')
        .expect(403);
    });

    it('should deny access to unauthenticated users', async () => {
      await request(app)
        .get('/api/admin/system/logging')
        .expect(403);
    });
  });

  describe('PATCH /api/admin/system/logging', () => {
    it('should update logging settings for super admin', async () => {
      const newSettings = {
        level: 'warn',
        destinations: { console: false, file: true, errorFile: true },
        filePath: 'custom/app.log',
        errorFilePath: 'custom/error.log'
      };

      const response = await request(app)
        .patch('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .send(newSettings)
        .expect(200);

      expect(response.body.message).toContain('updated successfully');

      // Verify settings were saved to mock store
      const logLevelSetting = inMemoryStore.systemSettings.find(s => s.key === 'logLevel');
      expect(logLevelSetting?.value).toBe('warn');

      const destinationsSetting = inMemoryStore.systemSettings.find(s => s.key === 'logDestinations');
      expect(JSON.parse(destinationsSetting?.value || '{}')).toEqual({ console: false, file: true, errorFile: true });
    });

    it('should validate log level', async () => {
      const invalidSettings = {
        level: 'invalid-level',
        destinations: { console: true, file: false, errorFile: false },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .send(invalidSettings)
        .expect(400);
    });

    it('should validate destinations structure', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: 'invalid-structure',
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .send(invalidSettings)
        .expect(400);
    });

    it('should validate file paths are strings', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: false },
        filePath: 123, // Not a string
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('x-test-user-id', '1')
        .send(invalidSettings)
        .expect(400);
    });

    it('should deny access to regular users', async () => {
      const settings = {
        level: 'warn',
        destinations: { console: true, file: false, errorFile: false },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('x-test-user-id', '2')
        .send(settings)
        .expect(403);
    });

    it('should deny access to unauthenticated users', async () => {
      const settings = {
        level: 'warn',
        destinations: { console: true, file: false, errorFile: false },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .send(settings)
        .expect(403);
    });
  });
}); 