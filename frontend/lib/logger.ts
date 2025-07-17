/**
 * Frontend Logging System for Conducky
 * 
 * Provides structured logging for browser environments with:
 * - Environment-specific log levels
 * - Error tracking and reporting
 * - User interaction analytics
 * - Performance monitoring
 * - Security-conscious data handling
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  eventSlug?: string;
  organizationSlug?: string;
  route?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  data?: any;
  timestamp: string;
  source: 'frontend';
}

class FrontendLogger {
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableRemoteLogging: boolean;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    // Determine log level based on environment
    this.logLevel = this.getEnvironmentLogLevel();
    this.enableConsole = process.env.NODE_ENV === 'development';
    this.enableRemoteLogging = process.env.NODE_ENV === 'production';
    this.sessionId = this.generateSessionId();
    
    // Setup error tracking
    this.setupGlobalErrorHandling();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  private getEnvironmentLogLevel(): LogLevel {
    const env = process.env.NODE_ENV;
    switch (env) {
      case 'development':
        return LogLevel.DEBUG;
      case 'test':
        return LogLevel.WARN;
      case 'production':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }
  private generateSessionId(): string {
    // Use crypto.getRandomValues() for cryptographically secure session IDs
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      const randomString = Array.from(array, byte => byte.toString(36)).join('').slice(0, 9);
      return `sess_${Date.now()}_${randomString}`;
    }
    
    // Fallback for environments without crypto.getRandomValues (like SSR)
    // Use a combination of timestamp and a longer random string for better entropy
    const randomPart = Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
    return `sess_${Date.now()}_${randomPart}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    data?: any
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        route: typeof window !== 'undefined' ? window?.location?.pathname : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator?.userAgent : undefined,
      },
      error,
      data: this.sanitizeData(data),
      timestamp: new Date().toISOString(),
      source: 'frontend'
    };

    return entry;
  }
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive information with more precise matching
    const sensitivePatterns = [
      /^password$/i,
      /^token$/i,
      /^authorization$/i,
      /^cookie$/i,
      /^session$/i,
      /^secret$/i,
      /^key$/i,
      /^private$/i,
      /^confidential$/i,
      /^ssn$/i,
      /^creditcard$/i,
      /.*password.*/i,
      /.*token.*/i,
      /.*secret.*/i,
      /.*private.*/i,
      /.*auth.*/i
    ];
    
    const sanitized = JSON.parse(JSON.stringify(data));
    
    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        if (sensitivePatterns.some(pattern => pattern.test(key))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeObject(obj[key]);
        }
      }
      return obj;
    };
    
    return sanitizeObject(sanitized);
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const logMethod = this.getConsoleMethod(entry.level);
    const prefix = `[${LogLevel[entry.level]}] ${entry.timestamp}`;
    
    if (entry.error) {
      logMethod(`${prefix} ${entry.message}`, entry.error, entry.context);
    } else if (entry.data) {
      logMethod(`${prefix} ${entry.message}`, entry.data, entry.context);
    } else {
      logMethod(`${prefix} ${entry.message}`, entry.context);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }  private async sendToRemoteLogging(entry: LogEntry): Promise<void> {
    if (!this.enableRemoteLogging || typeof window === 'undefined') return;

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });

        if (response.ok) {
          return; // Success
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          // Fallback to console if all retries fail
          console.error('Failed to send log to remote service after retries:', error);
          return;
        }
          // Exponential backoff: wait 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
      }
    }
  }

  private setupGlobalErrorHandling(): void {
    // Only set up error handling in browser environment
    if (typeof window === 'undefined') return;
    
    // Capture unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, event.error);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason?.toString(),
      }, event.reason instanceof Error ? event.reason : new Error(event.reason));
    });
  }
  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 
        'performance' in window && 
        typeof performance.getEntriesByType === 'function') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigation) {
              this.info('Page load performance', {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart,
              });
            }
          } catch {
            // Silently ignore performance monitoring errors in test environments
          }
        }, 0);
      });
    }
  }

  // Public logging methods
  public debug(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, undefined, data);
    this.addToBuffer(entry);
    this.logToConsole(entry);
  }

  public info(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, context, undefined, data);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    
    if (this.enableRemoteLogging) {
      this.sendToRemoteLogging(entry);
    }
  }

  public warn(message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, context, undefined, data);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    
    if (this.enableRemoteLogging) {
      this.sendToRemoteLogging(entry);
    }
  }

  public error(message: string, context?: LogContext, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error, data);
    this.addToBuffer(entry);
    this.logToConsole(entry);
    
    // Always send errors to remote logging in production
    if (this.enableRemoteLogging) {
      this.sendToRemoteLogging(entry);
    }
  }

  // User interaction tracking
  public trackUserAction(action: string, context?: LogContext, data?: any): void {
    this.info(`User action: ${action}`, {
      ...context,
      actionType: 'user_interaction',
    }, data);
  }

  // API request/response tracking
  public trackApiCall(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const entry = this.createLogEntry(
      level,
      `API ${method} ${url} - ${status}`,
      {
        ...context,
        actionType: 'api_call',
        method,
        url,
        status,
        duration,
      }
    );
    
    this.addToBuffer(entry);
    this.logToConsole(entry);
    
    if (this.enableRemoteLogging && level >= LogLevel.WARN) {
      this.sendToRemoteLogging(entry);
    }
  }

  // Form validation and submission tracking
  public trackFormEvent(formName: string, event: 'submit' | 'error' | 'validation_error', context?: LogContext, data?: any): void {
    const level = event === 'error' || event === 'validation_error' ? LogLevel.WARN : LogLevel.INFO;
    
    this.info(`Form ${event}: ${formName}`, {
      ...context,
      actionType: 'form_event',
      formName,
      event,
    }, data);
  }

  // Get recent logs for debugging
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  public clearLogs(): void {
    this.logBuffer = [];
  }

  // Export logs for debugging
  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
const logger = new FrontendLogger();

// Export logger instance
export { logger };

// Development helpers
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Make logger available globally for debugging
  (window as any).logger = logger;
}
