const { inMemoryStore } = require("../../__mocks__/@prisma/client");
const request = require("supertest");

// IMPORTANT: Do NOT mock requireRole in this file. This file is for real RBAC/forbidden tests only.
// This ensures the real RBAC middleware is used and forbidden/role-based access is actually tested.

describe("Event endpoints RBAC/forbidden tests", () => {
  let app;

  beforeEach(() => {
    // Reset inMemoryStore for isolation
    inMemoryStore.events = [{ id: "1", name: "Event1", slug: "event1" }];
    inMemoryStore.roles = [
      { id: "1", name: "System Admin" },
      { id: "2", name: "Admin" },
      { id: "3", name: "Responder" },
      { id: "4", name: "Reporter" },
    ];
    inMemoryStore.users = [
      { id: "1", email: "admin@example.com", name: "Admin" },
    ];
    
    // Clear both old and new role structures
    inMemoryStore.userEventRoles = [];
    inMemoryStore.userRoles = [];
    inMemoryStore.reports = [];
    
    // Require app after store setup to ensure shared state
    app = require("../../index");
  });

  it("should return 403 if user does not have required role for PATCH /events/:eventId/reports/:reportId/state", async () => {
    // Add only Reporter role for user 1, event 1 using unified RBAC structure
    inMemoryStore.userRoles.push({
      id: "1",
      userId: "1",
      roleId: "4",
      scopeType: "event",
      scopeId: "1",
      grantedAt: new Date(),
      role: { id: "4", name: "reporter" } // Use unified role name
    });
    
    // Also keep old structure for backward compatibility in case some parts still use it
    inMemoryStore.userEventRoles.push({
      userId: "1",
      eventId: "1",
      roleId: "4",
      role: { name: "Reporter" },
      user: { id: "1", email: "admin@example.com", name: "Admin" },
    });
    
    inMemoryStore.reports.push({
      id: "r6",
      eventId: "1",
      type: "harassment",
      description: "Report 6",
      state: "submitted",
    });
    
    // Simulate authentication by setting req.user and req.isAuthenticated via a session or test helper if needed
    // (If your app uses passport or similar, you may need to set a cookie or header)
    const agent = request.agent(app);
    // Patch the session or authentication as needed here if required by your app
    const res = await agent
      .patch("/api/events/1/reports/r6/state")
      .send({ state: "acknowledged" })
      .set("Accept", "application/json");
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });
});
