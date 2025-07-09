/**
 * Database Monitoring Service Tests
 * 
 * Tests for database performance monitoring and N+1 query detection
 */

// Import the class directly to create fresh instances
import { DatabaseMonitoringService } from '../../src/services/database-monitoring.service';

describe('DatabaseMonitoringService', () => {
  let monitor: DatabaseMonitoringService;

  beforeEach(() => {
    // Create a fresh instance for each test to avoid state pollution
    monitor = new (DatabaseMonitoringService as any)();
  });
  describe('Query Recording', () => {
    it('should record basic query metrics', () => {
      monitor.recordQuery('SELECT * FROM users', 50);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.totalExecutionTime).toBe(50);
      expect(metrics.averageExecutionTime).toBe(50);
      expect(metrics.slowQueries).toBe(0);
      expect(metrics.verySlowQueries).toBe(0);
    });

    it('should track slow queries', () => {
      monitor.recordQuery('SELECT * FROM users', 150);
      monitor.recordQuery('SELECT * FROM events', 600);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      expect(metrics.slowQueries).toBe(1); // 150ms query
      expect(metrics.verySlowQueries).toBe(1); // 600ms query
    });

    it('should normalize similar queries', () => {
      monitor.recordQuery('SELECT * FROM users WHERE id = $1', 50, '["123"]');
      monitor.recordQuery('SELECT * FROM users WHERE id = $1', 60, '["456"]');
      
      const metrics = monitor.getMetrics();
      expect(metrics.patterns).toHaveLength(1);
      expect(metrics.patterns[0].count).toBe(2);
      expect(metrics.patterns[0].pattern).toContain('SELECT * FROM users WHERE id = $?');
    });
  });
  describe('Request Tracking', () => {
    it('should track queries per request', () => {
      const requestId = 'test-request-1';
      
      monitor.startRequest(requestId);
      monitor.recordQuery('SELECT * FROM users', 50);
      monitor.recordQuery('SELECT * FROM events', 60);
      monitor.endRequest(requestId);
      
      const metrics = monitor.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      expect(metrics.nPlusOneDetected).toHaveLength(0); // Only 2 queries, not N+1
    });

    it('should detect potential N+1 patterns', () => {
      const requestId = 'test-request-n-plus-one';
      
      monitor.startRequest(requestId);
      
      // Simulate N+1 pattern: 1 query + 15 additional queries
      monitor.recordQuery('SELECT * FROM events', 50);
      for (let i = 0; i < 15; i++) {
        monitor.recordQuery(`SELECT * FROM users WHERE event_id = $1`, 20, `["${i}"]`);
      }
      
      monitor.endRequest(requestId);
      
      const metrics = monitor.getMetrics();
      expect(metrics.nPlusOneDetected).toHaveLength(1);
      expect(metrics.nPlusOneDetected[0]).toContain('16 queries');
    });
  });
  describe('Performance Analysis', () => {
    beforeEach(() => {
      // Set up test data
      monitor.recordQuery('SELECT * FROM users', 200); // Slow query
      monitor.recordQuery('SELECT * FROM events', 30);
      monitor.recordQuery('SELECT * FROM users', 150); // Same pattern, slow
      
      // Frequent query pattern
      for (let i = 0; i < 15; i++) {
        monitor.recordQuery('SELECT COUNT(*) FROM incidents', 25);
      }
      
      // Very slow query
      monitor.recordQuery('SELECT * FROM incidents JOIN users ON incidents.user_id = users.id', 800);
    });

    it('should identify slow queries', () => {
      const slowQueries = monitor.getSlowQueries();
      
      expect(slowQueries.length).toBeGreaterThan(0);
      expect(slowQueries[0].averageDuration).toBeGreaterThan(100);
    });

    it('should identify frequent queries', () => {
      const frequentQueries = monitor.getFrequentQueries();
      
      expect(frequentQueries.length).toBeGreaterThan(0);
      expect(frequentQueries[0].count).toBeGreaterThan(10);
    });

    it('should generate comprehensive report', () => {
      const report = monitor.generateReport();
      
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('recommendations');
      
      expect(report.summary.totalQueries).toBeGreaterThan(0);
      expect(report.performance.slowQueries).toBeDefined();
      expect(report.performance.frequentQueries).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should provide optimization recommendations', () => {
      const report = monitor.generateReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec => rec.includes('slow queries'))).toBe(true);
    });
  });
  describe('Query Pattern Normalization', () => {
    it('should normalize parameter placeholders', () => {
      monitor.recordQuery('SELECT * FROM users WHERE id = $1 AND status = $2', 50);
      monitor.recordQuery('SELECT * FROM users WHERE id = $1 AND status = $2', 60);
      
      const metrics = monitor.getMetrics();
      expect(metrics.patterns).toHaveLength(1);
      expect(metrics.patterns[0].pattern).toContain('$?');
    });

    it('should normalize IN clauses', () => {
      monitor.recordQuery('SELECT * FROM users WHERE id IN (1, 2, 3)', 50);
      monitor.recordQuery('SELECT * FROM users WHERE id IN (4, 5)', 60);
      
      const metrics = monitor.getMetrics();
      expect(metrics.patterns).toHaveLength(1);
      expect(metrics.patterns[0].pattern).toContain('IN (?)');
    });

    it('should normalize VALUES clauses', () => {
      monitor.recordQuery('INSERT INTO users VALUES (1, "John", "john@example.com")', 50);
      monitor.recordQuery('INSERT INTO users VALUES (2, "Jane", "jane@example.com")', 60);
      
      const metrics = monitor.getMetrics();
      expect(metrics.patterns).toHaveLength(1);
      expect(metrics.patterns[0].pattern).toContain('VALUES (?)');
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', () => {
      monitor.recordQuery('SELECT * FROM users', 50);
      monitor.recordQuery('SELECT * FROM events', 150);
      
      let metrics = monitor.getMetrics();
      expect(metrics.totalQueries).toBe(2);
      
      monitor.resetMetrics();
      
      metrics = monitor.getMetrics();
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.patterns).toHaveLength(0);
      expect(metrics.nPlusOneDetected).toHaveLength(0);
    });
  });
});
