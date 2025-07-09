import request from 'supertest';
import express from 'express';
import logsRoutes from '../../src/routes/logs.routes';

const app = express();
app.use(express.json());
app.use('/api', logsRoutes);

describe('Logs Routes', () => {
  describe('POST /api/logs', () => {
    it('should accept valid frontend log', async () => {
      const logData = {
        level: 3,
        message: 'Test log message',
        timestamp: '2024-01-15T10:30:00.000Z',
        source: 'frontend',
        context: {
          sessionId: 'test-123',
          route: '/test'
        }
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Log received successfully');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should reject invalid log level', async () => {
      const logData = {
        level: 10, // Invalid level
        message: 'Test log message',
        timestamp: '2024-01-15T10:30:00.000Z',
        source: 'frontend'
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid log data');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-frontend source', async () => {
      const logData = {
        level: 1,
        message: 'Test log message',
        timestamp: '2024-01-15T10:30:00.000Z',
        source: 'backend' // Invalid source
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Invalid log data');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });
});
