const request = require('supertest');
const app = require('../../index');

describe('System Admin Organizations Management', () => {
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
        .get('/api/organizations');
      
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