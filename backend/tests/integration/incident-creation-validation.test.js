const request = require("supertest");
const app = require("../../index");

describe("Report Creation Validation Tests", () => {
  describe("POST /api/events/slug/:slug/incidents - Future Date Validation", () => {
    it("should reject future incident dates beyond 24 hours", async () => {
      // Create a date 48 hours in the future
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report with future date", 
          title: "A valid report title",
          incidentAt: futureDate
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Incident date cannot be more than 24 hours in the future.");
    });

    it("should accept incident dates within 24 hours in the future", async () => {
      // Create a date 1 hour in the future (within 24 hour limit)
      const nearFutureDate = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report with near future date", 
          title: "A valid report title",
          incidentAt: nearFutureDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should reject invalid incident date format", async () => {
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report with invalid date", 
          title: "A valid report title",
          incidentAt: "not-a-date"
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Invalid incident date format.");
    });

    it("should accept past incident dates", async () => {
      // Create a date 1 week ago
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report with past date", 
          title: "A valid report title",
          incidentAt: pastDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should accept current date/time", async () => {
      // Create current timestamp
      const currentDate = new Date().toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report with current date", 
          title: "A valid report title",
          incidentAt: currentDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should accept exactly 24 hours in the future (boundary test)", async () => {
      // Create a date exactly 24 hours in the future
      const exactlyTwentyFourHours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report exactly 24 hours future", 
          title: "A valid report title",
          incidentAt: exactlyTwentyFourHours
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should reject slightly beyond 24 hours in the future (boundary test)", async () => {
      // Create a date 24 hours and 1 minute in the future
      const slightlyBeyondTwentyFourHours = new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report beyond 24 hours", 
          title: "A valid report title",
          incidentAt: slightlyBeyondTwentyFourHours
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Incident date cannot be more than 24 hours in the future.");
    });

    it("should allow creating reports without incident date", async () => {
      const res = await request(app)
        .post("/api/events/slug/event1/reports")
        .set("x-test-user-id", "2") // Regular user with reporter role
        .send({ 
          type: "harassment", 
          description: "Test report without incident date", 
          title: "A valid report title"
          // No incidentAt field
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt", null);
    });
  });
}); 