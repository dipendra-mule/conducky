const request = require("supertest");
const app = require("../../index");

describe("Report Creation Future Date Validation Tests", () => {
  describe("POST /api/events/slug/:slug/incidents - Future Date Validation", () => {
    it("should reject future incident dates beyond 24 hours", async () => {
      // Create a date 48 hours in the future
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
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
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report with near future date", 
          title: "A valid report title",
          incidentAt: nearFutureDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should reject invalid incident date format", async () => {
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report with invalid date", 
          title: "A valid report title",
          incidentAt: "not-a-date"
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Invalid incident date format.");
    });

    it("should accept past incident dates", async () => {
      // Create a date 1 hour in the past
      const pastDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report with past date", 
          title: "A valid report title",
          incidentAt: pastDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should accept current date/time", async () => {
      // Use current date/time
      const currentDate = new Date().toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report with current date", 
          title: "A valid report title",
          incidentAt: currentDate
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt");
    });

    it("should reject slightly beyond 24 hours in the future (boundary test)", async () => {
      // Create a date 24 hours and 1 minute in the future (just beyond limit)
      const justBeyondLimit = new Date(Date.now() + (24 * 60 * 60 * 1000) + (1 * 60 * 1000)).toISOString();
      
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report just beyond limit", 
          title: "A valid report title",
          incidentAt: justBeyondLimit
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });

    it("should allow creating reports without incident date", async () => {
      const res = await request(app)
        .post("/api/events/slug/event1/incidents")
        .send({ 
          description: "Test report without incident date", 
          title: "A valid report title"
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.incident).toHaveProperty("incidentAt", null);
    });
  });
}); 