const { inMemoryStore } = require("../../__mocks__/@prisma/client");
const request = require("supertest");
const app = require("../../index");

describe("Event endpoints", () => {
  afterEach(() => jest.clearAllMocks());

  describe("POST /events", () => {
    it("should create an event as System Admin", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Test Event", slug: "test-event" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("event");
      expect(res.body.event).toHaveProperty("slug", "test-event");
    });
    it("should fail if missing fields", async () => {
      const res = await request(app).post("/api/events").set("x-test-user-id", "1").send({ name: "" });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
    it("should fail if slug is invalid", async () => {
      const res = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Event", slug: "Invalid Slug!" });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
    it("should fail if slug already exists", async () => {
      await request(app).post("/api/events").set("x-test-user-id", "1").send({ name: "Event1", slug: "dupe" });
      const res = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Event2", slug: "dupe" });
      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error", "Slug already exists.");
    });
  });

  describe("POST /events/:eventId/roles", () => {
    it("should assign a role to a user", async () => {
      const eventRes = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Role Event2", slug: "role-event2" });
      const eventId = eventRes.body.event.id;
      const res = await request(app)
        .post(`/api/events/${eventId}/roles`)
        .set("x-test-user-id", "1")
        .send({ userId: "1", roleName: "event_admin" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Role assigned.");
    });
    it("should fail if missing fields", async () => {
      // Create unique slug to avoid conflicts with other tests
      const uniqueSlug = `role-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const eventRes = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Role Event2", slug: uniqueSlug });
      
      // Ensure event creation succeeded before proceeding
      expect(eventRes.statusCode).toBe(201);
      expect(eventRes.body).toHaveProperty("event");
      expect(eventRes.body.event).toHaveProperty("id");
      
      const eventId = eventRes.body.event.id;
      const res = await request(app).post(`/api/events/${eventId}/roles`).set("x-test-user-id", "1").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
    it("should fail if user does not exist", async () => {
      const eventRes = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Role Event3", slug: "role-event3" });
      const eventId = eventRes.body.event.id;
      
      const res = await request(app)
        .post(`/api/events/${eventId}/roles`)
        .set("x-test-user-id", "1")
        .send({ userId: "999", roleName: "event_admin" });
        
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "User or role not found");
    });
    it("should fail if role does not exist", async () => {
      const eventRes = await request(app)
        .post("/api/events")
        .set("x-test-user-id", "1")
        .send({ name: "Role Event4", slug: "role-event4" });
      const eventId = eventRes.body.event.id;
      const res = await request(app)
        .post(`/api/events/${eventId}/roles`)
        .set("x-test-user-id", "1")
        .send({ userId: "1", roleName: "NotARole" });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "User or role not found");
    });
  });

  describe("GET /events/:eventId", () => {
    it("should return event details (success)", async () => {
      const res = await request(app).get("/api/events/1").set("x-test-user-id", "1");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("event");
      expect(res.body.event).toHaveProperty("id", "1");
      expect(res.body.event).toHaveProperty("name", "Event1");
    });
    it("should return 404 for a non-existent event", async () => {
      const res = await request(app).get("/api/events/999").set("x-test-user-id", "1");
      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /events/:eventId/incidents", () => {
    let incidentId;
    beforeAll(async () => {
      const res = await request(app)
        .post("/api/events/1/incidents")
        .set("x-test-user-id", "1")
        .send({ description: "Report for related file", title: "Related File Report Title" });
      incidentId = res.body.incident.id;
    });

    it("should upload multiple related files to an incident", async () => {
      const res = await request(app)
        .post(`/api/events/1/incidents/${incidentId}/related-files`)
        .set("x-test-user-id", "1")
        .attach("relatedFiles", Buffer.from("test file 1"), "test1.txt")
        .attach("relatedFiles", Buffer.from("test file 2"), "test2.txt");

      expect(res.statusCode).toBe(201);
      expect(res.body.files).toHaveLength(2);
      expect(res.body.files[0].filename).toBe("test1.txt");
    });

    it("should download a related file", async () => {
      const uploadRes = await request(app)
        .post(`/api/events/1/incidents/${incidentId}/related-files`)
        .set("x-test-user-id", "1")
        .attach("relatedFiles", Buffer.from("downloadme"), "download.txt");
      const fileId = uploadRes.body.files[0].id;
      
      const res = await request(app).get(`/api/events/1/incidents/${incidentId}/related-files/${fileId}/download`).set("x-test-user-id", "1");

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-disposition"]).toBe(
        'attachment; filename="download.txt"'
      );
      expect(res.text).toBe("downloadme");
    });
  });
});
