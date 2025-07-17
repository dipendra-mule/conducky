import { Request } from 'express';
import winstonLogger from '../config/logger';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn', 
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogContext {
  userId?: string;
  eventId?: string;
  reportId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private isTest = process.env.NODE_ENV === 'test';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context
    };

    if (this.isDevelopment) {
      // Pretty print for development
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${context ? ' ' + JSON.stringify(context, null, 2) : ''}`;
    } else {
      // Structured JSON for production
      return JSON.stringify(logEntry);
    }
  }
  error(message: string, context?: LogContext): void {
    winstonLogger().error(this.formatMessage(LogLevel.ERROR, message, context));
  }

  warn(message: string, context?: LogContext): void {
    winstonLogger().warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isProduction) {
      winstonLogger().debug(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      winstonLogger().debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Security-specific logging - always log security events
  security(message: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      security: true,
      severity: 'high'
    };
    winstonLogger().error(this.formatMessage(LogLevel.ERROR, `SECURITY: ${message}`, securityContext));
  }

  // Request logging helper
  logRequest(req: Request, message: string, additionalContext?: LogContext): void {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: (req.user as any)?.id,
      ...additionalContext
    };

    this.info(message, context);
  }

  // Authentication logging
  auth(message: string, context?: LogContext): void {
    const authContext = {
      ...context,
      category: 'authentication'
    };
    this.info(`AUTH: ${message}`, authContext);
  }

  // File upload logging
  fileUpload(filename: string, mimetype: string, size: number, userId?: string): void {
    this.info('File uploaded', {
      category: 'file_upload',
      filename,
      mimetype,
      size,
      userId
    });
  }
}

export const logger = new Logger(); 