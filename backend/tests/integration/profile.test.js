const { inMemoryStore } = require("../../__mocks__/@prisma/client");
const request = require("supertest");

// Mock bcrypt
jest.mock("bcrypt");
const bcrypt = require("bcrypt");

const app = require("../../index");

describe("Profile Management API", () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      id: "1", // Using "1" to match the test authentication middleware
      email: "admin@example.com", // Using admin@example.com to match test middleware
      name: "Admin", // Using Admin to match test middleware
      passwordHash: "$2b$10$hashedpassword"
    };
    
    // Reset in-memory store
    inMemoryStore.users = [mockUser];
    inMemoryStore.userAvatars = [];
    inMemoryStore.events = [
      { id: "event1", name: "Test Event", slug: "test-event", description: "Test event description" }
    ];
    inMemoryStore.userEventRoles = [];
    inMemoryStore.eventInvites = [];
  });

  describe("PATCH /users/me/profile", () => {
    it("should update user profile successfully", async () => {
      const updateData = {
        name: "Updated Name",
        email: "updated@example.com"
      };

      const res = await request(app)
        .patch('/users/me/profile')
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe(updateData.name);
      expect(res.body.user.email).toBe(updateData.email.toLowerCase());
      
      // Check that the user was actually updated in the store
      const updatedUser = inMemoryStore.users.find(u => u.id === "1");
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email.toLowerCase());
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .patch('/users/me/profile')
        .send({ email: "invalid-email" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("valid email address");
    });

    it("should reject email already in use", async () => {
      // Add another user with the email we're trying to use
      inMemoryStore.users.push({ id: "other-user", email: "existing@example.com", name: "Other User" });

      const res = await request(app)
        .patch("/api/users/me/profile")
        .send({ email: "existing@example.com" });

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain("already in use");
    });

    it("should allow user to keep their own email", async () => {
      const res = await request(app)
        .patch("/api/users/me/profile")
        .send({ 
          name: "New Name",
          email: mockUser.email 
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe("New Name");
      
      // Check that the user was updated in the store
      const updatedUser = inMemoryStore.users.find(u => u.id === "1");
      expect(updatedUser.name).toBe("New Name");
      expect(updatedUser.email).toBe(mockUser.email);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .patch('/users/me/profile')
        .set("x-test-disable-auth", "true")
        .send({ name: "Test" });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });
  });

  describe("PATCH /users/me/password", () => {
    beforeEach(() => {
      bcrypt.compare.mockResolvedValue(true); // Current password is correct
      bcrypt.hash.mockResolvedValue("$2b$10$newhashedpassword");
    });

    it("should change password successfully", async () => {
      const res = await request(app)
        .patch("/api/users/me/password")
        .send({
          currentPassword: "currentpass",
          newPassword: "NewPassword123!"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Password updated successfully");
      expect(bcrypt.compare).toHaveBeenCalledWith("currentpass", "$2b$10$hashedpassword");
      expect(bcrypt.hash).toHaveBeenCalledWith("NewPassword123!", 10);
      
      // Check that the user's password was updated in the store
      const updatedUser = inMemoryStore.users.find(u => u.id === "1");
      expect(updatedUser.passwordHash).toBe("$2b$10$newhashedpassword");
    });

    it("should reject incorrect current password", async () => {
      bcrypt.compare.mockResolvedValueOnce(false); // Wrong current password

      const res = await request(app)
        .patch("/api/users/me/password")
        .send({
          currentPassword: "wrongpass",
          newPassword: "NewPassword123!"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Current password is incorrect");
    });

    it("should reject weak new password", async () => {
      bcrypt.compare.mockResolvedValueOnce(true); // Current password is correct

      const res = await request(app)
        .patch("/api/users/me/password")
        .send({
          currentPassword: "currentpass",
          newPassword: "weak"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("security requirements");
    });

    it("should require both passwords", async () => {
      const res = await request(app)
        .patch("/api/users/me/password")
        .send({ currentPassword: "test" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Current password and new password are required");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .patch("/api/users/me/password")
        .set("x-test-disable-auth", "true")
        .send({
          currentPassword: "current",
          newPassword: "NewPassword123!"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });
  });

  describe("DELETE /users/me/events/:eventId", () => {
    let mockEvent;
    let mockUserEventRoles;

    beforeEach(() => {
      mockEvent = {
        id: "event1",
        name: "Test Event",
        slug: "test-event"
      };

      mockUserEventRoles = [
        {
          id: "uer1",
          userId: mockUser.id,
          eventId: mockEvent.id,
          event: mockEvent,
          role: { name: "Reporter" }
        }
      ];
    });

    it("should allow user to leave event", async () => {
      // Set up user event roles in the store using unified RBAC
      inMemoryStore.userRoles = [
        {
          id: "ur1",
          userId: mockUser.id,
          roleId: "3",
          scopeType: "event",
          scopeId: mockEvent.id,
          grantedAt: new Date(),
          role: { id: "3", name: "responder" },
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        }
      ];
      inMemoryStore.userEventRoles = []; // Clear legacy data

      const res = await request(app)
        .delete(`/users/me/events/${mockEvent.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Successfully left Test Event");
      
      // Check that the user was removed from the event (unified RBAC)
      const remainingRoles = inMemoryStore.userRoles.filter(
        ur => ur.userId === mockUser.id && ur.scopeId === mockEvent.id && ur.scopeType === "event"
      );
      expect(remainingRoles).toHaveLength(0);
    });

    it("should prevent only admin from leaving", async () => {
      // Set up user as the only admin using unified RBAC
      inMemoryStore.userRoles = [
        {
          id: "ur1",
          userId: mockUser.id,
          roleId: "2",
          scopeType: "event",
          scopeId: mockEvent.id,
          grantedAt: new Date(),
          role: { id: "2", name: "event_admin" },
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        }
      ];
      inMemoryStore.userEventRoles = []; // Clear legacy data

      const res = await request(app)
        .delete(`/users/me/events/${mockEvent.id}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("only admin");
    });

    it("should handle user not in event", async () => {
      // Clear user event roles
      inMemoryStore.userRoles = [];
      inMemoryStore.userEventRoles = [];

      const res = await request(app)
        .delete(`/users/me/events/${mockEvent.id}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toContain("not a member");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .delete(`/users/me/events/${mockEvent.id}`)
        .set("x-test-disable-auth", "true");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });
  });

  describe("GET /api/users/me/events", () => {
    it("should return user events with roles", async () => {
      // Set up test events in the store 
      inMemoryStore.events = [
        { id: "event1", name: "Event 1", slug: "event-1", description: "First event" },
        { id: "event2", name: "Event 2", slug: "event-2", description: "Second event" }
      ];

      // Set up unified user roles in the store
      inMemoryStore.userRoles = [
        // Event Admin role for event1
        {
          id: "ur1",
          userId: mockUser.id,
          roleId: "2",
          scopeType: "event",
          scopeId: "event1",
          grantedAt: new Date(),
          role: { id: "2", name: "event_admin" },
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        },
        // Incidenter role for event1  
        {
          id: "ur2",
          userId: mockUser.id,
          roleId: "4",
          scopeType: "event",
          scopeId: "event1",
          grantedAt: new Date(),
          role: { id: "4", name: "reporter" },
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        },
        // Responder role for event2
        {
          id: "ur3",
          userId: mockUser.id,
          roleId: "3",
          scopeType: "event",
          scopeId: "event2",
          grantedAt: new Date(),
          role: { id: "3", name: "responder" },
          user: { id: mockUser.id, email: mockUser.email, name: mockUser.name }
        }
      ];

      const res = await request(app)
        .get("/api/users/me/events");

      expect(res.statusCode).toBe(200);
      expect(res.body.events).toHaveLength(2); // Two unique events
      
      const event1 = res.body.events.find(e => e.id === "event1");
      expect(event1.roles).toEqual(["event_admin", "reporter"]);
      
      const event2 = res.body.events.find(e => e.id === "event2");
      expect(event2.roles).toEqual(["responder"]);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .get("/api/users/me/events")
        .set("x-test-disable-auth", "true");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });
  });

  describe("POST /invites/:code/redeem", () => {
    let mockInvite;
    let mockEvent;

    beforeEach(() => {
      mockEvent = {
        id: "event1",
        name: "Test Event",
        slug: "test-event"
      };

      mockInvite = {
        code: "ABC123",
        eventId: mockEvent.id,
        roleId: "4", // Use valid unified reporter role ID
        disabled: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        maxUses: 10,
        useCount: 5
      };

      // Ensure both legacy and unified roles are available
      inMemoryStore.roles = [
        { id: "1", name: "System Admin" },
        { id: "2", name: "Event Admin" },
        { id: "3", name: "Responder" },
        { id: "4", name: "Reporter" },
      ];
      inMemoryStore.unifiedRoles = [
        { id: "1", name: "system_admin", description: "System Administrator", level: 100 },
        { id: "2", name: "event_admin", description: "Event Administrator", level: 80 },
        { id: "3", name: "responder", description: "Incident Responder", level: 60 },
        { id: "4", name: "reporter", description: "Report Creator", level: 40 },
      ];
    });

    it("should redeem invite successfully", async () => {
      // Set up invite in the store
      inMemoryStore.eventInvites = [mockInvite];
      inMemoryStore.events = [mockEvent];
      inMemoryStore.userEventRoles = []; // User not already member
      inMemoryStore.userRoles = []; // Clear unified roles too

      const res = await request(app)
        .post("/api/invites/ABC123/redeem");

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Joined event successfully");
      expect(res.body.eventSlug).toBe(mockEvent.slug);
      
      // Check that user was added to event in unified RBAC system
      const userRole = inMemoryStore.userRoles.find(
        ur => ur.userId === mockUser.id && ur.scopeId === mockInvite.eventId && ur.scopeType === 'event'
      );
      expect(userRole).toBeDefined();
      
      // Check the role by looking up the roleId in unifiedRoles
      const role = inMemoryStore.unifiedRoles.find(r => r.id === userRole.roleId);
      expect(role).toBeDefined();
      expect(role.name).toBe('reporter'); // The unified role name for roleId "4"
    });

    it("should reject invalid invite code", async () => {
      // Clear invites from store
      inMemoryStore.eventInvites = [];

      const res = await request(app)
        .post("/api/invites/INVALID/redeem");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Invalid or disabled invite link");
    });

    it("should reject disabled invite", async () => {
      const disabledInvite = { ...mockInvite, disabled: true };
      inMemoryStore.eventInvites = [disabledInvite];

      const res = await request(app)
        .post("/api/invites/ABC123/redeem");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Invalid or disabled invite link");
    });

    it("should reject expired invite", async () => {
      const expiredInvite = { 
        ...mockInvite, 
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      };
      inMemoryStore.eventInvites = [expiredInvite];

      const res = await request(app)
        .post("/api/invites/ABC123/redeem");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("expired");
    });

    it("should reject invite at max uses", async () => {
      const maxUsedInvite = { ...mockInvite, useCount: 10, maxUses: 10 };
      inMemoryStore.eventInvites = [maxUsedInvite];

      const res = await request(app)
        .post("/api/invites/ABC123/redeem");

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("maximum uses");
    });

    it("should reject if user already member", async () => {
      inMemoryStore.eventInvites = [mockInvite];
      inMemoryStore.userEventRoles = [
        {
          id: "existing",
          userId: mockUser.id,
          eventId: mockInvite.eventId,
          roleId: "3"
        }
      ];

      const res = await request(app)
        .post("/api/invites/ABC123/redeem");

      expect(res.statusCode).toBe(409);
      expect(res.body.error).toContain("already a member");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/invites/ABC123/redeem")
        .set("x-test-disable-auth", "true");

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });
  });
}); 