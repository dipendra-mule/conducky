import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting configurations for different operations
 */

/**
 * Helper function to check if rate limiting should be skipped
 * Skip in test, development, or when NODE_ENV is not set
 */
const shouldSkipRateLimit = (req: Request): boolean => {
  const env = process.env.NODE_ENV;
  return env === 'test' || env === 'development' || !env;
};

/**
 * General API rate limiting
 * 100 requests per 15 minutes per IP
 * Skip rate limiting in test and development environments
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Authentication rate limiting
 * 5 attempts per 15 minutes per IP for login/register
 * Skip rate limiting in test and development environments
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many login attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Password reset rate limiting
 * 3 attempts per hour per IP
 * Skip rate limiting in test and development environments
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many password reset attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Password reset rate limit exceeded',
      message: 'Too many password reset attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Report creation rate limiting
 * 10 reports per hour per IP to prevent spam
 * Skip rate limiting in test and development environments
 */
export const reportCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many reports created from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Report creation rate limit exceeded',
      message: 'Too many reports created from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Comment creation rate limiting
 * 30 comments per hour per IP
 * Skip rate limiting in test and development environments
 */
export const commentCreationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many comments created from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Comment creation rate limit exceeded',
      message: 'Too many comments created from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * File upload rate limiting
 * 20 uploads per hour per IP
 * Skip rate limiting in test and development environments
 */
export const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'File upload rate limit exceeded',
      message: 'Too many file uploads from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Email sending rate limiting
 * 5 emails per hour per IP (for notifications, invites, etc.)
 * Skip rate limiting in test and development environments
 */
export const emailSendingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many emails sent from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Email sending rate limit exceeded',
      message: 'Too many emails sent from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

/**
 * Search rate limiting
 * 100 searches per 15 minutes per IP
 * Skip rate limiting in test and development environments
 */
export const searchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many search requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Search rate limit exceeded',
      message: 'Too many search requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

/**
 * Strict rate limiting for sensitive operations
 * 3 attempts per hour per IP
 * Skip rate limiting in test and development environments
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    error: 'Too many sensitive operation attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: shouldSkipRateLimit,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Strict rate limit exceeded',
      message: 'Too many sensitive operation attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});