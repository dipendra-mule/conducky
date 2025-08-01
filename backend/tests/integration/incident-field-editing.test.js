const request = require("supertest");
const app = require("../../index");

describe("Report Field Editing API Integration Tests", () => {
  describe("PATCH /api/events/:eventId/incidents/:incidentId/description", () => {
    it("should allow reporter to edit description", async () => {
      const response = await request(app)
        .patch("/api/events/1/incidents/1/description")
        .set("x-test-user-id", "2") // Regular user (reporter)
        .send({ description: "Updated description with more details about the incident" })
        .expect(200);

      expect(response.body.incident).toBeDefined();
      expect(response.body.incident.description).toBe("Updated description with more details about the incident");
    });

    it("should forbid responder from editing description", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/description")
        .set("x-test-user-id", "3") // Responder user
        .send({ description: "Updated description" })
        .expect(403);
    });

    it("should require description field", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/description")
        .set("x-test-user-id", "2") // Incidenter user
        .send({})
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/description")
        .set("x-test-disable-auth", "true")
        .send({ description: "Test description" })
        .expect(401);
    });
  });

  describe("PATCH /api/events/:eventId/incidents/:incidentId/incident-date", () => {
    it("should allow reporter to edit incident date", async () => {
      const testDate = new Date().toISOString();
      const response = await request(app)
        .patch("/api/events/1/incidents/1/incident-date")
        .set("x-test-user-id", "2") // Incidenter user
        .send({ incidentAt: testDate })
        .expect(200);

      expect(response.body.incident).toBeDefined();
    });

    it("should allow responder to edit incident date", async () => {
      const testDate = new Date().toISOString();
      const response = await request(app)
        .patch("/api/events/1/incidents/1/incident-date")
        .set("x-test-user-id", "3") // Responder user
        .send({ incidentAt: testDate })
        .expect(200);

      expect(response.body.incident).toBeDefined();
    });

    it("should reject invalid date format", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/incident-date")
        .set("x-test-user-id", "2") // Incidenter user
        .send({ incidentAt: "invalid-date" })
        .expect(400);
    });

    it("should require authentication", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/incident-date")
        .set("x-test-disable-auth", "true")
        .send({ incidentAt: new Date().toISOString() })
        .expect(401);
    });
  });

  describe("PATCH /api/events/:eventId/incidents/:incidentId/parties", () => {
    it("should allow reporter to edit parties involved", async () => {
      const response = await request(app)
        .patch("/api/events/1/incidents/1/parties")
        .set("x-test-user-id", "2") // Incidenter user
        .send({ parties: "Updated parties involved in the incident" })
        .expect(200);

      expect(response.body.incident).toBeDefined();
      expect(response.body.incident.parties).toBe("Updated parties involved in the incident");
    });

    it("should allow responder to edit parties involved", async () => {
      const response = await request(app)
        .patch("/api/events/1/incidents/1/parties")
        .set("x-test-user-id", "3") // Responder user
        .send({ parties: "Updated parties by responder" })
        .expect(200);

      expect(response.body.incident).toBeDefined();
      expect(response.body.incident.parties).toBe("Updated parties by responder");
    });

    it("should require authentication", async () => {
      await request(app)
        .patch("/api/events/1/incidents/1/parties")
        .set("x-test-disable-auth", "true")
        .send({ parties: "Test parties" })
        .expect(401);
    });
  });
});
