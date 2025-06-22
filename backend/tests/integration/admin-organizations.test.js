const request = require('supertest');
const app = require('../../index');
const { inMemoryStore } = require('../../__mocks__/@prisma/client');

// Mock the RBAC middleware
jest.mock('../../src/utils/rbac', () => ({
  requireRole: (allowedRoles) => (req, res, next) => {
    req.isAuthenticated = () => true;
    
    const { inMemoryStore } = require('../../__mocks__/@prisma/client');
    
    // Use test user ID from header if provided, otherwise default to user 1
    const testUserId = req.headers['x-test-user-id'] || '1';
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Check if user has any of the allowed roles
    const hasRole = inMemoryStore.userRoles?.some(ur => {
      if (ur.userId !== testUserId) return false;
      
      // Map unified role names to display names
      const roleNameMap = {
        'system_admin': 'System Admin',
        'event_admin': 'Event Admin',
        'responder': 'Responder',
        'reporter': 'Reporter'
      };
      
      const displayName = roleNameMap[ur.role?.name] || ur.role?.name;
      return allowedRoles.includes(displayName);
    });
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  },
  requireSystemAdmin: () => (req, res, next) => {
    req.isAuthenticated = () => true;
    
    const { inMemoryStore } = require('../../__mocks__/@prisma/client');
    
    // Use test user ID from header if provided, otherwise default to user 1
    const testUserId = req.headers['x-test-user-id'] || '1';
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Check if user has System Admin role
    const hasSystemAdminRole = inMemoryStore.userRoles?.some(ur => 
      ur.userId === testUserId && 
      ur.role?.name === 'system_admin' && 
      ur.scopeType === 'system'
    );
    
    if (!hasSystemAdminRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  }
}));

describe('System Admin Organizations Management', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();

    // Setup test users
    const mockUsers = [
      { id: '1', email: 'admin@example.com', name: 'System Admin User' },
      { id: '999', email: 'user@example.com', name: 'Regular User' }
    ];

    // Setup unified RBAC roles
    const mockUserRoles = [
      // System Admin user
      { 
        id: '1', 
        userId: '1', 
        roleId: '1', 
        scopeType: 'system', 
        scopeId: 'global', 
        grantedAt: new Date(), 
        role: { id: '1', name: 'system_admin' } 
      }
      // User '999' has no roles (regular user)
    ];

    // Setup organizations
    const mockOrganizations = [
      {
        id: 'org1',
        name: 'Test Organization',
        slug: 'test-org',
        description: 'A test organization'
      }
    ];

    // Setup in-memory store
    inMemoryStore.users = mockUsers;
    inMemoryStore.userRoles = mockUserRoles;
    inMemoryStore.organizations = mockOrganizations;
  });

  describe('GET /api/organizations', () => {
    it('should return error status for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set('x-test-disable-auth', 'true'); // Disable authentication for this test
      
      // Should return 401 for unauthenticated requests
      expect(response.status).toBe(401);
    });

    it('should be protected by authentication/authorization', async () => {
      // Test with a non-System Admin user
      const response = await request(app)
        .get('/api/organizations')
        .set('x-test-user-id', '999'); // Non-existent user (not System Admin)
      
      // Should return 403 for non-System Admin users
      expect(response.status).toBe(403);
    });

    it('should allow System Admin access', async () => {
      // Test with System Admin user (default user id '1' is System Admin)
      const response = await request(app)
        .get('/api/organizations')
        .set('x-test-user-id', '1'); // Explicitly set System Admin user
      
      // Should return 200 for System Admin
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/organizations', () => {
    it('should return error status for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('x-test-disable-auth', 'true') // Disable authentication for this test
        .send({
          name: 'Test Organization',
          slug: 'test-org',
        });
      
      // Should return 401 for unauthenticated requests
      expect(response.status).toBe(401);
    });

    it('should return error status for non-System Admin users', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('x-test-user-id', '999') // Non-existent user (not System Admin)
        .send({
          name: 'Test Organization',
          slug: 'test-org',
        });
      
      // Should return 403 for non-System Admin users
      expect(response.status).toBe(403);
    });

    it('should allow System Admin to create organizations', async () => {
      const response = await request(app)
        .post('/api/organizations')
        .set('x-test-user-id', '1') // Explicitly set System Admin user
        .send({
          name: 'Test Organization',
          slug: 'test-org-new',
          description: 'A test organization'
        });
      
      // Should return 201 for System Admin with valid data
      expect(response.status).toBe(201);
      expect(response.body.organization).toBeDefined();
      expect(response.body.organization.name).toBe('Test Organization');
    });
  });
}); 