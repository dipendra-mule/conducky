/**
 * Database Monitoring Middleware
 * 
 * Tracks database queries per request to detect N+1 patterns
 * and provides request-scoped performance monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { databaseMonitor } from '../services/database-monitoring.service';
import logger from '../config/logger';

// Extend Request interface to include monitoring context
declare global {
  namespace Express {
    interface Request {
      dbMonitoringId?: string;
    }
  }
}

/**
 * Middleware to track database queries per request
 */
export const databaseMonitoringMiddleware = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Generate unique ID for this request
  const monitoringId = uuidv4();
  req.dbMonitoringId = monitoringId;
  
  // Start monitoring for this request
  databaseMonitor.startRequest(monitoringId);
  
  // Track when the response finishes
  const originalSend = res.send;
  res.send = function(body) {
    // End monitoring when response is sent
    databaseMonitor.endRequest(monitoringId);
    
    // Log request performance summary in development
    if (process.env.NODE_ENV === 'development') {
      const metrics = databaseMonitor.getMetrics();
      logger().debug('Request database performance', {
        method: req.method,
        url: req.url,
        monitoringId,
        totalQueries: metrics.totalQueries,
        averageExecutionTime: Math.round(metrics.averageExecutionTime * 100) / 100
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Performance report endpoint middleware
 */
export const performanceReportMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path === '/api/admin/database/performance' && req.method === 'GET') {
    const report = databaseMonitor.generateReport();
    res.json(report);
    return;
  }
  next();
};

export default databaseMonitoringMiddleware;
