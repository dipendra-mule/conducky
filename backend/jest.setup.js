// CRITICAL: Load test environment variables FIRST, before any other modules
// This must happen before Prisma client is initialized in index.js
process.env.NODE_ENV = 'test';

// Clear any existing environment variables that might interfere
delete process.env.DATABASE_URL;

// Load test environment with override to ensure it takes precedence
require('dotenv').config({ path: '.env.test', override: true });

// Verify the environment is set correctly
if (process.env.JEST_VERBOSE === 'true') {
  console.log('🧪 Test Environment Loaded');
  console.log('📝 NODE_ENV:', process.env.NODE_ENV);
  console.log('🗄️ Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@')); // Hide password
}

// Ensure the test database URL is set (skip check in CI environments)
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
if (!isCI && (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('localhost:5432'))) {
  throw new Error('Test environment not loaded correctly. DATABASE_URL should point to localhost:5432');
}

// Log database connection strategy
if (process.env.JEST_VERBOSE === 'true') {
  if (isCI) {
    console.log('🔧 CI Environment detected - using mocked database');
  } else {
    console.log('🏠 Local Environment - using real database connection');
  }
}

// Global test teardown to prevent hanging tests
const { PrismaClient } = require('@prisma/client');

// Track all Prisma instances for cleanup
global.prismaInstances = new Set();

// Override PrismaClient constructor to track instances
const OriginalPrismaClient = PrismaClient;
global.PrismaClient = class extends OriginalPrismaClient {
  constructor(...args) {
    super(...args);
    global.prismaInstances.add(this);
  }
};

// Global cleanup function for test teardown
global.cleanupPrismaConnections = async () => {
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('🧹 Cleaning up Prisma connections...');
  }
  
  // Disconnect all tracked Prisma instances
  const disconnectPromises = Array.from(global.prismaInstances).map(async (prisma) => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Warning: Error disconnecting Prisma client:', error.message);
      }
    }
  });
  
  await Promise.all(disconnectPromises);
  global.prismaInstances.clear();
  
  // Clean up OAuth interval if it exists
  try {
    const { cleanupOAuthInterval } = require('./src/routes/auth.routes');
    if (cleanupOAuthInterval) {
      cleanupOAuthInterval();
    }
  } catch (error) {
    // Ignore if auth routes not loaded
  }
  
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('✅ Test cleanup complete');
  }
};

// Handle process exit to ensure cleanup
process.on('exit', () => {
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('🚪 Process exiting...');
  }
});

process.on('SIGINT', async () => {
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('🛑 SIGINT received, cleaning up...');
  }
  try {
    await global.cleanupPrismaConnections();
  } catch (error) {
    // Ignore errors during forced cleanup
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('🛑 SIGTERM received, cleaning up...');
  }
  try {
    await global.cleanupPrismaConnections();
  } catch (error) {
    // Ignore errors during forced cleanup
  }
  process.exit(0);
});

// Global teardown function
global.teardown = async () => {
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('🧹 Running global test teardown...');
  }
  await global.cleanupPrismaConnections();
  if (process.env.JEST_VERBOSE === 'true') {
    console.log('✅ Global teardown complete');
  }
}; 