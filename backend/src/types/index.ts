/**
 * Type Definitions Export
 * 
 * This file aggregates all TypeScript type definitions for clean imports
 */

import { Request } from 'express';
import { UserResponse } from '../../types';
import logger from '../config/logger';

// Re-export existing types from the current types directory
export * from '../../types';

// Additional types will be added here as we extract modules
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Note: Use standard Express Request type directly in routes

// Service response types
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
} 