const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const adminRoutes = require('../../src/routes/admin.routes');
const { setupTestDatabase, cleanupTestDatabase } = require('../setup');

describe('Admin Logging Settings API', () => {
  let app;
  let prisma;
  let superAdminToken;
  let regularUserToken;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    prisma = testDb.prisma;
    
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    // Create test users
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@test.com',
        name: 'Super Admin',
        hashedPassword: 'hashed_password',
        isSystemAdmin: true,
        emailVerified: true
      }
    });

    const regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        name: 'Regular User',
        hashedPassword: 'hashed_password',
        isSystemAdmin: false,
        emailVerified: true
      }
    });

    // Mock auth tokens (in real tests, these would be JWT tokens)
    superAdminToken = `Bearer mock-token-${superAdmin.id}`;
    regularUserToken = `Bearer mock-token-${regularUser.id}`;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up any existing logging settings
    await prisma.systemSetting.deleteMany({
      where: {
        key: {
          in: ['logLevel', 'logDestinations', 'logFilePath', 'logErrorFilePath']
        }
      }
    });
  });

  describe('GET /api/admin/system/logging', () => {
    it('should return current logging settings for super admin', async () => {
      // Seed some test logging settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'logLevel', value: 'debug' },
          { key: 'logDestinations', value: JSON.stringify({ console: true, file: false, errorFile: true }) },
          { key: 'logFilePath', value: 'test/combined.log' },
          { key: 'logErrorFilePath', value: 'test/error.log' }
        ]
      });

      const response = await request(app)
        .get('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .expect(200);

      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toEqual({
        level: 'debug',
        destinations: { console: true, file: false, errorFile: true },
        filePath: 'test/combined.log',
        errorFilePath: 'test/error.log'
      });

      expect(response.body).toHaveProperty('availableLevels');
      expect(response.body.availableLevels).toContain('error');
      expect(response.body.availableLevels).toContain('warn');
      expect(response.body.availableLevels).toContain('info');
      expect(response.body.availableLevels).toContain('debug');

      expect(response.body).toHaveProperty('availableDestinations');
      expect(response.body.availableDestinations).toEqual(['console', 'file', 'errorFile']);
    });

    it('should return default settings when no settings exist', async () => {
      const response = await request(app)
        .get('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .expect(200);

      expect(response.body.settings).toHaveProperty('level');
      expect(response.body.settings).toHaveProperty('destinations');
      expect(response.body.settings).toHaveProperty('filePath');
      expect(response.body.settings).toHaveProperty('errorFilePath');
    });

    it('should deny access to regular users', async () => {
      await request(app)
        .get('/api/admin/system/logging')
        .set('Authorization', regularUserToken)
        .expect(403);
    });

    it('should deny access to unauthenticated users', async () => {
      await request(app)
        .get('/api/admin/system/logging')
        .expect(401);
    });
  });

  describe('PATCH /api/admin/system/logging', () => {
    it('should update logging settings for super admin', async () => {
      const newSettings = {
        level: 'warn',
        destinations: { console: false, file: true, errorFile: true },
        filePath: 'custom/app.log',
        errorFilePath: 'custom/error.log'
      };

      const response = await request(app)
        .patch('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .send(newSettings)
        .expect(200);

      expect(response.body.message).toContain('updated successfully');

      // Verify settings were saved to database
      const savedSettings = await prisma.systemSetting.findMany({
        where: {
          key: { in: ['logLevel', 'logDestinations', 'logFilePath', 'logErrorFilePath'] }
        }
      });

      const settingsMap = savedSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      expect(settingsMap.logLevel).toBe('warn');
      expect(JSON.parse(settingsMap.logDestinations)).toEqual(newSettings.destinations);
      expect(settingsMap.logFilePath).toBe('custom/app.log');
      expect(settingsMap.logErrorFilePath).toBe('custom/error.log');
    });

    it('should validate log level', async () => {
      const invalidSettings = {
        level: 'invalid_level',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .send(invalidSettings)
        .expect(400);
    });

    it('should validate destinations structure', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: { invalid: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .send(invalidSettings)
        .expect(400);
    });

    it('should require valid file paths', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: true },
        filePath: '', // empty path
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('Authorization', superAdminToken)
        .send(invalidSettings)
        .expect(400);
    });

    it('should deny access to regular users', async () => {
      const settings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .set('Authorization', regularUserToken)
        .send(settings)
        .expect(403);
    });

    it('should deny access to unauthenticated users', async () => {
      const settings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log'
      };

      await request(app)
        .patch('/api/admin/system/logging')
        .send(settings)
        .expect(401);
    });
  });

  describe('Integration with System Settings', () => {
    it('should include logging settings in system settings response', async () => {
      // Seed logging settings
      await prisma.systemSetting.createMany({
        data: [
          { key: 'logLevel', value: 'info' },
          { key: 'logDestinations', value: JSON.stringify({ console: true, file: true, errorFile: false }) }
        ]
      });

      const response = await request(app)
        .get('/api/admin/system/settings')
        .set('Authorization', superAdminToken)
        .expect(200);

      expect(response.body.settings).toHaveProperty('logging');
      expect(response.body.settings.logging).toHaveProperty('level', 'info');
      expect(response.body.settings.logging).toHaveProperty('destinations');
    });
  });
}); 