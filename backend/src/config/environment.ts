import logger from '../config/logger';
/**
 * Environment Configuration
 * 
 * This module handles environment variable validation and configuration
 */

// Environment variable validation
export interface EnvironmentConfig {
  // Core application settings
  NODE_ENV: string;
  PORT: number;
  
  // Security and session management
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string | undefined;
  
  // API and frontend configuration
  CORS_ORIGIN: string;
  FRONTEND_BASE_URL: string;
  FRONTEND_URL: string | undefined;
  BACKEND_BASE_URL: string;
  API_BASE_URL: string;
  PRODUCTION_DOMAIN: string | undefined;
  
  // Database
  DATABASE_URL: string | undefined;
  
  // Email configuration
  EMAIL_PROVIDER: string | undefined;
  EMAIL_FROM: string | undefined;
  EMAIL_REPLY_TO: string | undefined;
  SMTP_HOST: string | undefined;
  SMTP_PORT: number | undefined;
  SMTP_USER: string | undefined;
  SMTP_PASS: string | undefined;
  SMTP_SECURE: boolean;
  SENDGRID_API_KEY: string | undefined;
}

// Default environment values
const defaultValues: Partial<EnvironmentConfig> = {
  NODE_ENV: 'development',
  PORT: 4000,
  SESSION_SECRET: process.env.NODE_ENV === 'production' ? undefined : 'dev-only-secret-changeme', // Force production to use env var
  CORS_ORIGIN: 'http://localhost:3001',
  FRONTEND_BASE_URL: 'http://localhost:3001',
  BACKEND_BASE_URL: 'http://localhost:4000',
  API_BASE_URL: 'http://localhost:4000',
  EMAIL_PROVIDER: 'console',
  EMAIL_FROM: 'noreply@conducky.local',
  SMTP_PORT: 587,
  SMTP_SECURE: false,
};

// Parse and validate environment variables
export function getEnvironmentConfig(): EnvironmentConfig {
  // Validate required production secrets
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required in production');
  }

  const config: EnvironmentConfig = {
    // Core application settings
    NODE_ENV: process.env.NODE_ENV || defaultValues.NODE_ENV!,
    PORT: parseInt(process.env.PORT || defaultValues.PORT!.toString()),
    
    // Security and session management
    SESSION_SECRET: process.env.SESSION_SECRET || defaultValues.SESSION_SECRET!,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    
    // API and frontend configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || defaultValues.CORS_ORIGIN!,
    FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || defaultValues.FRONTEND_BASE_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL,
    BACKEND_BASE_URL: process.env.BACKEND_BASE_URL || defaultValues.BACKEND_BASE_URL!,
    API_BASE_URL: process.env.API_BASE_URL || defaultValues.API_BASE_URL!,
    PRODUCTION_DOMAIN: process.env.PRODUCTION_DOMAIN,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // Email configuration
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || defaultValues.EMAIL_PROVIDER,
    EMAIL_FROM: process.env.EMAIL_FROM || defaultValues.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : defaultValues.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  };

  return config;
}

// Validate required environment variables
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = getEnvironmentConfig();

  // Check for production-specific requirements
  if (config.NODE_ENV === 'production') {
    if (config.SESSION_SECRET === 'dev-only-secret-changeme') {
      errors.push('SESSION_SECRET must be set to a secure value in production');
    }
    
    if (!config.DATABASE_URL) {
      errors.push('DATABASE_URL is required in production');
    }

    if (!config.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is required in production');
    }

    if (!config.PRODUCTION_DOMAIN) {
      errors.push('PRODUCTION_DOMAIN should be set in production for security headers');
    }
  }

  // Validate email configuration if provider is set
  if (config.EMAIL_PROVIDER === 'smtp') {
    if (!config.SMTP_HOST) {
      errors.push('SMTP_HOST is required when EMAIL_PROVIDER is smtp');
    }
    if (!config.SMTP_USER || !config.SMTP_PASS) {
      errors.push('SMTP_USER and SMTP_PASS are required when EMAIL_PROVIDER is smtp');
    }
  }

  if (config.EMAIL_PROVIDER === 'sendgrid') {
    if (!config.SENDGRID_API_KEY) {
      errors.push('SENDGRID_API_KEY is required when EMAIL_PROVIDER is sendgrid');
    }
  }

  // Validate URL formats
  const urlsToValidate = [
    { name: 'FRONTEND_BASE_URL', value: config.FRONTEND_BASE_URL },
    { name: 'BACKEND_BASE_URL', value: config.BACKEND_BASE_URL },
    { name: 'API_BASE_URL', value: config.API_BASE_URL }
  ];

  urlsToValidate.forEach(({ name, value }) => {
    try {
      new URL(value);
    } catch (error) {
      errors.push(`Invalid URL format for ${name}: ${value}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export the current environment configuration
export const environmentConfig = getEnvironmentConfig(); 