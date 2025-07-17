const { LoggingService } = require('../../src/services/logging.service');
const { PrismaClient } = require('@prisma/client');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  addColors: jest.fn(),
}));

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    systemSetting: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  })),
}));

describe('LoggingService', () => {
  let loggingService;
  let mockPrisma;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    loggingService = LoggingService.getInstance(mockPrisma);
  });

  afterEach(() => {
    // Reset singleton instance for clean tests
    LoggingService.resetInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton pattern)', () => {
      const instance1 = LoggingService.getInstance(mockPrisma);
      const instance2 = LoggingService.getInstance(mockPrisma);
      expect(instance1).toBe(instance2);
    });

    it('should throw error if called without prisma on first call', () => {
      LoggingService.resetInstance();
      expect(() => LoggingService.getInstance()).toThrow('Prisma client is required for first initialization');
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no database settings exist', async () => {
      mockPrisma.systemSetting.findMany.mockResolvedValue([]);

      const settings = await loggingService.getSettings();

      expect(settings).toEqual({
        level: expect.any(String),
        destinations: {
          console: true,
          file: true,
          errorFile: true,
        },
        filePath: 'logs/combined.log',
        errorFilePath: 'logs/error.log',
      });
    });

    it('should return database settings when they exist', async () => {
      const mockSettings = [
        { key: 'logLevel', value: 'warn' },
        { key: 'logDestinations', value: JSON.stringify({ console: false, file: true, errorFile: true }) },
        { key: 'logFilePath', value: 'custom/app.log' },
        { key: 'logErrorFilePath', value: 'custom/error.log' },
      ];

      mockPrisma.systemSetting.findMany.mockResolvedValue(mockSettings);

      const settings = await loggingService.getSettings();

      expect(settings).toEqual({
        level: 'warn',
        destinations: { console: false, file: true, errorFile: true },
        filePath: 'custom/app.log',
        errorFilePath: 'custom/error.log',
      });
    });

    it('should handle JSON parse errors gracefully', async () => {
      const mockSettings = [
        { key: 'logLevel', value: 'info' },
        { key: 'logDestinations', value: 'invalid-json' }, // Invalid JSON
      ];

      mockPrisma.systemSetting.findMany.mockResolvedValue(mockSettings);

      const settings = await loggingService.getSettings();

      // Should fall back to default destinations
      expect(settings.destinations).toEqual({
        console: true,
        file: true,
        errorFile: true,
      });
    });
  });

  describe('updateSettings', () => {
    it('should validate log level', async () => {
      const invalidSettings = {
        level: 'invalid_level',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log',
      };

      await expect(loggingService.updateSettings(invalidSettings))
        .rejects.toThrow('Invalid log level');
    });

    it('should validate destinations structure', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: { invalid: true }, // Missing required destinations
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log',
      };

      await expect(loggingService.updateSettings(invalidSettings))
        .rejects.toThrow('Invalid destinations configuration');
    });

    it('should validate file paths', async () => {
      const invalidSettings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: true },
        filePath: '', // Empty path
        errorFilePath: 'logs/error.log',
      };

      await expect(loggingService.updateSettings(invalidSettings))
        .rejects.toThrow('File paths cannot be empty');
    });

    it('should save valid settings to database', async () => {
      const validSettings = {
        level: 'debug',
        destinations: { console: true, file: false, errorFile: true },
        filePath: 'test/app.log',
        errorFilePath: 'test/error.log',
      };

      mockPrisma.systemSetting.upsert.mockResolvedValue({});

      await loggingService.updateSettings(validSettings);

      expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledTimes(4);
      expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith({
        where: { key: 'logLevel' },
        update: { value: 'debug' },
        create: { key: 'logLevel', value: 'debug' },
      });
    });

    it('should update logger configuration after saving settings', async () => {
      const validSettings = {
        level: 'error',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'test/app.log',
        errorFilePath: 'test/error.log',
      };

      mockPrisma.systemSetting.upsert.mockResolvedValue({});
      const reconfigureSpy = jest.spyOn(loggingService, 'reconfigureLogger');

      await loggingService.updateSettings(validSettings);

      expect(reconfigureSpy).toHaveBeenCalledWith(validSettings);
    });
  });

  describe('getAvailableLogLevels', () => {
    it('should return all winston log levels', () => {
      const levels = loggingService.getAvailableLogLevels();
      expect(levels).toEqual(['error', 'warn', 'info', 'http', 'debug']);
    });
  });

  describe('getAvailableDestinations', () => {
    it('should return all available log destinations', () => {
      const destinations = loggingService.getAvailableDestinations();
      expect(destinations).toEqual(['console', 'file', 'errorFile']);
    });
  });

  describe('reconfigureLogger', () => {
    it('should create new logger with provided settings', () => {
      const settings = {
        level: 'warn',
        destinations: { console: true, file: false, errorFile: true },
        filePath: 'test/app.log',
        errorFilePath: 'test/error.log',
      };

      loggingService.reconfigureLogger(settings);

      // Verify winston.createLogger was called
      const winston = require('winston');
      expect(winston.createLogger).toHaveBeenCalled();
    });
  });

  describe('getLogger', () => {
    it('should return current logger instance', () => {
      const logger = loggingService.getLogger();
      expect(logger).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in getSettings', async () => {
      mockPrisma.systemSetting.findMany.mockRejectedValue(new Error('Database error'));

      const settings = await loggingService.getSettings();

      // Should return default settings when database fails
      expect(settings).toEqual(expect.objectContaining({
        level: expect.any(String),
        destinations: expect.any(Object),
      }));
    });

    it('should propagate database errors in updateSettings', async () => {
      const validSettings = {
        level: 'info',
        destinations: { console: true, file: true, errorFile: true },
        filePath: 'logs/app.log',
        errorFilePath: 'logs/error.log',
      };

      mockPrisma.systemSetting.upsert.mockRejectedValue(new Error('Database error'));

      await expect(loggingService.updateSettings(validSettings))
        .rejects.toThrow('Database error');
    });
  });
}); 