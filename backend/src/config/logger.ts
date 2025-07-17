import winston from 'winston';
import { LoggingService } from '../services/logging.service';

// This will be initialized when the database connection is available
let loggingService: LoggingService | null = null;

// Create a default logger for immediate use (before database is available)
const createDefaultLogger = () => {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  };

  winston.addColors(colors);

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  );

  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ];

  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports,
    exitOnError: false,
  });

  (logger as any).stream = {
    write: (message: string) => {
      logger.http(message.trim());
    },
  };

  return logger;
};

// Initialize with default logger
let logger = createDefaultLogger();

/**
 * Initialize the configurable logging service
 * This should be called after the database connection is established
 */
export const initializeLoggingService = async (prisma: any) => {
  try {
    loggingService = LoggingService.getInstance(prisma);
    await loggingService.loadSettings();
    logger = loggingService.getLogger();
    logger.info('Configurable logging service initialized');
  } catch (error) {
    // Fall back to default logger if initialization fails
    logger.warn('Failed to initialize configurable logging service, using default logger:', error);
  }
};

/**
 * Get the current logger instance
 */
export const getLogger = () => {
  return loggingService ? loggingService.getLogger() : logger;
};

/**
 * Update logging settings (if configurable logging is available)
 */
export const updateLoggingSettings = async (settings: any) => {
  if (loggingService) {
    await loggingService.updateSettings(settings);
    logger = loggingService.getLogger();
    logger.info('Logging settings updated successfully');
  } else {
    throw new Error('Configurable logging service is not available');
  }
};

/**
 * Get current logging settings (if configurable logging is available)
 */
export const getLoggingSettings = async () => {
  if (loggingService) {
    return await loggingService.getLoggingSettings();
  } else {
    throw new Error('Configurable logging service is not available');
  }
};

/**
 * Get available log levels
 */
export const getAvailableLogLevels = () => {
  if (loggingService) {
    return loggingService.getAvailableLogLevels();
  } else {
    return ['error', 'warn', 'info', 'http', 'debug'];
  }
};

/**
 * Get available log destinations
 */
export const getAvailableDestinations = () => {
  if (loggingService) {
    return loggingService.getAvailableDestinations();
  } else {
    return [
      { key: 'console', label: 'Console Output' },
      { key: 'file', label: 'Log File' },
      { key: 'errorFile', label: 'Error Log File' },
    ];
  }
};

// Export the default logger for backward compatibility
export default getLogger();
