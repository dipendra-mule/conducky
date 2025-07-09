const { inMemoryStore } = require("../../__mocks__/@prisma/client");
const request = require('supertest');
const app = require('../../index');

// Mock RBAC to use test authentication
jest.mock("../../src/utils/rbac", () => ({
  requireSystemAdmin: () => (req, res, next) => {
    req.isAuthenticated = () => true;
    
    const { inMemoryStore } = require("../../__mocks__/@prisma/client");
    
    // Use test user ID from header if provided, otherwise default to user 1
    const testUserId = req.headers['x-test-user-id'] || "1";
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Check both legacy and unified role data
    const isSystemAdminLegacy = inMemoryStore.userEventRoles.some(
      (uer) => uer.userId === req.user.id && uer.role.name === "System Admin"
    );
    const isSystemAdminUnified = inMemoryStore.userRoles.some(
      (ur) => ur.userId === req.user.id && ur.role.name === "system_admin" && ur.scopeType === "system"
    );
    
    if (!isSystemAdminLegacy && !isSystemAdminUnified) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    
    next();
  },
  requireRole: (allowedRoles) => (req, res, next) => {
    req.isAuthenticated = () => true;
    
    const { inMemoryStore } = require("../../__mocks__/@prisma/client");
    
    // Use test user ID from header if provided, otherwise default to user 1
    const testUserId = req.headers['x-test-user-id'] || "1";
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Check for allowed roles (simplified for testing)
    next();
  }
}));

beforeEach(() => {
  // Reset the inMemoryStore for test isolation
  inMemoryStore.events.length = 1;
  inMemoryStore.incidents.length = 1;
  inMemoryStore.users.length = 1;
  inMemoryStore.userEventRoles.length = 1;
});

describe('Slug-based Incidents API', () => {  describe('GET /api/events/slug/:slug/incidents', () => {
    it('should return incidents for an event by slug', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/incidents')
        .set('x-test-user-id', '1'); // Set test user

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('incidents');
      expect(Array.isArray(res.body.incidents)).toBe(true);
    });

    it('should support query parameters', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/incidents?limit=5&recent=1')
        .set('x-test-user-id', '1');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('incidents');
    });

    it('should return 404 for non-existent event slug', async () => {
      const res = await request(app)
        .get('/api/events/slug/non-existent-event/incidents')
        .set('x-test-user-id', '1');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Event not found.');
    });
  });
});
