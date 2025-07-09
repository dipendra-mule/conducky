/**
 * Database Performance Monitoring Service
 * 
 * Tracks database query performance, identifies N+1 queries,
 * and provides metrics for optimization
 */

import logger from '../config/logger';

interface QueryMetrics {
  totalQueries: number;
  slowQueries: number;
  verySlowQueries: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  queryPatterns: Map<string, number>;
  nPlusOneDetected: string[];
}

interface QueryPattern {
  hash: string;
  pattern: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  lastExecuted: Date;
}

class DatabaseMonitoringService {
  private queryMetrics!: QueryMetrics; // Will be initialized in resetMetrics()
  private queryPatterns: Map<string, QueryPattern>;
  private requestQueryCounts: Map<string, number>;
  private currentRequestId: string | null = null;
  
  constructor() {
    this.queryPatterns = new Map();
    this.requestQueryCounts = new Map();
    this.resetMetrics();
  }

  /**
   * Start monitoring for a new request
   */
  startRequest(requestId: string): void {
    this.currentRequestId = requestId;
    this.requestQueryCounts.set(requestId, 0);
  }

  /**
   * End monitoring for a request and check for N+1 patterns
   */
  endRequest(requestId: string): void {
    const queryCount = this.requestQueryCounts.get(requestId) || 0;
    
    // Detect potential N+1 queries (more than 10 queries per request)
    if (queryCount > 10) {
      logger.warn('Potential N+1 query pattern detected', {
        requestId,
        queryCount,
        performance: 'n_plus_one_suspected'
      });
      
      this.queryMetrics.nPlusOneDetected.push(
        `Request ${requestId}: ${queryCount} queries`
      );
    }
    
    this.requestQueryCounts.delete(requestId);
    this.currentRequestId = null;
  }

  /**
   * Record a database query execution
   */
  recordQuery(query: string, duration: number, params?: string): void {
    // Update overall metrics
    this.queryMetrics.totalQueries++;
    this.queryMetrics.totalExecutionTime += duration;
    this.queryMetrics.averageExecutionTime = 
      this.queryMetrics.totalExecutionTime / this.queryMetrics.totalQueries;

    // Track slow queries
    if (duration > 500) {
      this.queryMetrics.verySlowQueries++;
    } else if (duration > 100) {
      this.queryMetrics.slowQueries++;
    }

    // Track query patterns
    const pattern = this.normalizeQuery(query);
    const hash = this.hashQuery(pattern);
    
    if (this.queryPatterns.has(hash)) {
      const existing = this.queryPatterns.get(hash)!;
      existing.count++;
      existing.totalDuration += duration;
      existing.averageDuration = existing.totalDuration / existing.count;
      existing.lastExecuted = new Date();
    } else {
      this.queryPatterns.set(hash, {
        hash,
        pattern,
        count: 1,
        totalDuration: duration,
        averageDuration: duration,
        lastExecuted: new Date()
      });
    }

    // Track queries per request
    if (this.currentRequestId) {
      const current = this.requestQueryCounts.get(this.currentRequestId) || 0;
      this.requestQueryCounts.set(this.currentRequestId, current + 1);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): QueryMetrics & { patterns: QueryPattern[] } {
    return {
      ...this.queryMetrics,
      patterns: Array.from(this.queryPatterns.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Top 20 most frequent patterns
    };
  }

  /**
   * Get slow query analysis
   */
  getSlowQueries(): QueryPattern[] {
    return Array.from(this.queryPatterns.values())
      .filter(pattern => pattern.averageDuration > 100)
      .sort((a, b) => b.averageDuration - a.averageDuration);
  }

  /**
   * Get most frequent queries (potential optimization targets)
   */
  getFrequentQueries(): QueryPattern[] {
    return Array.from(this.queryPatterns.values())
      .filter(pattern => pattern.count > 10)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Reset all metrics (useful for periodic reports)
   */  resetMetrics(): void {
    this.queryMetrics = {
      totalQueries: 0,
      slowQueries: 0,
      verySlowQueries: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      queryPatterns: new Map(),
      nPlusOneDetected: []
    };
    
    // Also clear the query patterns and request tracking
    this.queryPatterns.clear();
    this.requestQueryCounts.clear();
    this.currentRequestId = null;
  }

  /**
   * Generate performance report
   */
  generateReport(): object {
    const metrics = this.getMetrics();
    const slowQueries = this.getSlowQueries();
    const frequentQueries = this.getFrequentQueries();

    return {
      summary: {
        totalQueries: metrics.totalQueries,
        slowQueries: metrics.slowQueries,
        verySlowQueries: metrics.verySlowQueries,
        averageExecutionTime: Math.round(metrics.averageExecutionTime * 100) / 100,
        nPlusOneDetected: metrics.nPlusOneDetected.length
      },
      performance: {
        slowQueries: slowQueries.slice(0, 10),
        frequentQueries: frequentQueries.slice(0, 10),
        nPlusOnePatterns: metrics.nPlusOneDetected
      },
      recommendations: this.generateRecommendations(metrics, slowQueries, frequentQueries)
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    metrics: QueryMetrics, 
    slowQueries: QueryPattern[], 
    frequentQueries: QueryPattern[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.verySlowQueries > 0) {
      recommendations.push(
        `${metrics.verySlowQueries} very slow queries (>500ms) detected. Consider adding indexes or optimizing queries.`
      );
    }

    if (metrics.nPlusOneDetected.length > 0) {
      recommendations.push(
        `${metrics.nPlusOneDetected.length} potential N+1 query patterns detected. Consider using 'include' or 'select' to reduce queries.`
      );
    }

    if (frequentQueries.length > 5) {
      recommendations.push(
        `${frequentQueries.length} frequently executed queries found. Consider caching or query optimization.`
      );
    }

    if (metrics.averageExecutionTime > 50) {
      recommendations.push(
        `Average query execution time is ${Math.round(metrics.averageExecutionTime)}ms. Consider database optimization.`
      );
    }

    return recommendations;
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '$?') // Replace parameter placeholders
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/IN \([^)]+\)/gi, 'IN (?)') // Normalize IN clauses
      .replace(/VALUES \([^)]+\)/gi, 'VALUES (?)') // Normalize VALUES clauses
      .trim();
  }

  /**
   * Generate hash for query pattern
   */
  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitoringService();

// Export class for testing
export { DatabaseMonitoringService };
export default databaseMonitor;
