const { inMemoryStore } = require("../../__mocks__/@prisma/client");
const request = require("supertest");
const app = require("../../index");

// Mock the RBAC middleware like in the events test
jest.mock("../../src/utils/rbac", () => ({
  requireRole: (allowedRoles) => (req, res, next) => {
    req.isAuthenticated = () => true;
    
    const { inMemoryStore } = require("../../__mocks__/@prisma/client");
    
    // Use test user ID from header if provided, otherwise default to user 1
    const testUserId = req.headers['x-test-user-id'] || "1";
    const testUser = inMemoryStore.users.find(u => u.id === testUserId) || { id: testUserId, email: `user${testUserId}@example.com`, name: `User${testUserId}` };
    req.user = testUser;
    
    // Get eventId from params
    let eventId = req.params.eventId || req.params.slug;
    
    // If slug is provided, resolve to eventId
    if (req.params.slug && !eventId.match(/^\d+$/)) {
      const event = inMemoryStore.events.find(e => e.slug === req.params.slug);
      if (event) {
        eventId = event.id;
      }
    }

    // Map legacy role names to unified role names for compatibility
    const roleMapping = {
      'System Admin': 'system_admin',
      'Event Admin': 'event_admin', 
      'Responder': 'responder',
      'Reporter': 'reporter'
    };
    
    // Map allowed roles to include both legacy and unified names
    const mappedRoles = [...allowedRoles];
    allowedRoles.forEach(role => {
      if (roleMapping[role]) {
        mappedRoles.push(roleMapping[role]);
      }
      // Also check reverse mapping
      for (const [legacy, unified] of Object.entries(roleMapping)) {
        if (unified === role && !mappedRoles.includes(legacy)) {
          mappedRoles.push(legacy);
        }
      }
    });
    
    // Check for System Admin role globally (check both legacy and unified data)
    const isSystemAdminLegacy = inMemoryStore.userEventRoles.some(
      (uer) => uer.userId === req.user.id && uer.role.name === "System Admin"
    );
    const isSystemAdminUnified = inMemoryStore.userRoles.some(
      (ur) => ur.userId === req.user.id && ur.role.name === "system_admin" && ur.scopeType === "system"
    );
    
    if ((mappedRoles.includes("System Admin") || mappedRoles.includes("system_admin")) && (isSystemAdminLegacy || isSystemAdminUnified)) {
      return next();
    }
    
    // Check for allowed roles for this specific event (both legacy and unified)
    const legacyUserRoles = inMemoryStore.userEventRoles.filter(
      (uer) => uer.userId === req.user.id && uer.eventId === eventId
    );
    const unifiedUserRoles = inMemoryStore.userRoles.filter(
      (ur) => ur.userId === req.user.id && ur.scopeType === "event" && ur.scopeId === eventId
    );
    
    const hasLegacyRole = legacyUserRoles.some((uer) =>
      mappedRoles.includes(uer.role.name)
    );
    const hasUnifiedRole = unifiedUserRoles.some((ur) =>
      mappedRoles.includes(ur.role.name)
    );
    
    if (!hasLegacyRole && !hasUnifiedRole) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }
    
    next();
  },
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
      res.status(403).json({ error: "Forbidden: System Admins only" });
      return;
    }
    
    next();
  },
}));

beforeEach(() => {
  // Reset inMemoryStore to a clean state for each test
  inMemoryStore.events = [{ id: "1", name: "Event1", slug: "event1" }];
  inMemoryStore.roles = [
    { id: "1", name: "system_admin" },
    { id: "2", name: "event_admin" },
    { id: "3", name: "responder" },
    { id: "4", name: "reporter" },
  ];
  inMemoryStore.users = [
    { id: "1", email: "admin@example.com", name: "Admin", createdAt: new Date('2024-01-01') },
    { id: "2", email: "responder@example.com", name: "Responder", createdAt: new Date('2024-01-02') },
    { id: "3", email: "reporter@example.com", name: "Reporter", createdAt: new Date('2024-01-03') },
  ];
  // Unified RBAC data - this is what the migrated services now use
  inMemoryStore.userRoles = [
    {
      userId: "1",
      scopeType: "event",
      scopeId: "1",
      roleId: "2",
      role: { name: "event_admin" },
      user: { id: "1", email: "admin@example.com", name: "Admin", createdAt: new Date('2024-01-01') },
    },
    {
      userId: "2",
      scopeType: "event",
      scopeId: "1",
      roleId: "3",
      role: { name: "responder" },
      user: { id: "2", email: "responder@example.com", name: "Responder", createdAt: new Date('2024-01-02') },
    },
    {
      userId: "3",
      scopeType: "event",
      scopeId: "1",
      roleId: "4",
      role: { name: "reporter" },
      user: { id: "3", email: "reporter@example.com", name: "Reporter", createdAt: new Date('2024-01-03') },
    },
  ];
  // Legacy data - kept for backward compatibility during migration
  inMemoryStore.userEventRoles = [
    {
      userId: "1",
      eventId: "1",
      roleId: "2",
      role: { name: "Event Admin" },
      user: { id: "1", email: "admin@example.com", name: "Admin", createdAt: new Date('2024-01-01') },
    },
    {
      userId: "2",
      eventId: "1",
      roleId: "3",
      role: { name: "Responder" },
      user: { id: "2", email: "responder@example.com", name: "Responder", createdAt: new Date('2024-01-02') },
    },
    {
      userId: "3",
      eventId: "1",
      roleId: "4",
      role: { name: "Reporter" },
      user: { id: "3", email: "reporter@example.com", name: "Reporter", createdAt: new Date('2024-01-03') },
    },
  ];
  inMemoryStore.reports = [];
  inMemoryStore.auditLogs = [];
  inMemoryStore.reportComments = [];
});

describe('Team Management Endpoints', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /api/events/slug/:slug/users/:userId', () => {
    it('should get individual user profile (admin access)', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/2')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('2');
      expect(res.body.user.email).toBe('responder@example.com');
      expect(res.body.roles).toContain('responder');
      expect(res.body.joinDate).toBeDefined();
    });

    it('should allow responder to view user profiles', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/1')
        .set('x-test-user-id', '2') // Responder user
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe('1');
      expect(res.body.roles).toBeDefined();
    });

    it('should deny access to reporters', async () => {
      await request(app)
        .get('/api/events/slug/event1/users/1')
        .set('x-test-user-id', '3') // Incidenter user
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/events/slug/event1/users/999')
        .set('x-test-user-id', '1') // Admin user
        .expect(404);
    });

    it('should return 403 for non-existent event (security: no permissions)', async () => {
      await request(app)
        .get('/api/events/slug/nonexistent/users/1')
        .set('x-test-user-id', '1') // Admin user
        .expect(403);
    });
  });

  describe('GET /api/events/slug/:slug/users/:userId/activity', () => {
    it('should get user activity timeline (admin access)', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/1/activity')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(res.body.activities).toBeDefined();
      expect(Array.isArray(res.body.activities)).toBe(true);
      expect(res.body.total).toBeDefined();
      expect(typeof res.body.total).toBe('number');
    });

    it('should support pagination parameters', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/1/activity?page=1&limit=5')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(res.body.activities).toBeDefined();
      expect(res.body.activities.length).toBeLessThanOrEqual(5);
    });

    it('should deny access to reporters', async () => {
      await request(app)
        .get('/api/events/slug/event1/users/1/activity')
        .set('x-test-user-id', '3') // Incidenter user
        .expect(403);
    });
  });

  describe('GET /api/events/slug/:slug/users/:userId/incidents', () => {
    it('should get user reports (admin access)', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/1/incidents')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(res.body.reports).toBeDefined();
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.total).toBeDefined();
    });

    it('should filter by report type', async () => {
      const submittedRes = await request(app)
        .get('/api/events/slug/event1/users/1/incidents?type=submitted')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      const assignedRes = await request(app)
        .get('/api/events/slug/event1/users/1/incidents?type=assigned')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(submittedRes.body.reports).toBeDefined();
      expect(assignedRes.body.reports).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/events/slug/event1/users/1/incidents?page=1&limit=10')
        .set('x-test-user-id', '1') // Admin user
        .expect(200);

      expect(res.body.reports.length).toBeLessThanOrEqual(10);
    });

    it('should deny access to reporters', async () => {
      await request(app)
        .get('/api/events/slug/event1/users/1/incidents')
        .set('x-test-user-id', '3') // Incidenter user
        .expect(403);
    });
  });
}); 