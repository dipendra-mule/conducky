/**
 * React Hooks for Frontend Logging
 * 
 * Provides React-specific logging utilities for:
 * - Component lifecycle tracking
 * - User interaction logging
 * - Error boundary integration
 * - Performance monitoring
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { logger, LogContext } from '@/lib/logger';

export interface UseLoggerOptions {
  componentName?: string;
  userId?: string;
  eventSlug?: string;
  organizationSlug?: string;
  trackMounts?: boolean;
  trackUnmounts?: boolean;
  trackRenders?: boolean;
}

/**
 * Main logging hook for React components
 */
export function useLogger(options: UseLoggerOptions = {}) {
  const {
    componentName = 'UnknownComponent',
    userId,
    eventSlug,
    organizationSlug,
    trackMounts = false,
    trackUnmounts = false,
    trackRenders = false,
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);
  // Base context for all logs from this component - memoized to prevent unnecessary re-renders
  const baseContext: LogContext = useMemo(() => ({
    componentName,
    userId,
    eventSlug,
    organizationSlug,
  }), [componentName, userId, eventSlug, organizationSlug]);

  // Track component mount
  useEffect(() => {
    mountTime.current = Date.now();
    
    if (trackMounts) {
      logger.debug(`Component mounted: ${componentName}`, baseContext);
    }

    // Track component unmount
    return () => {
      if (trackUnmounts) {
        const mountDuration = Date.now() - mountTime.current;
        logger.debug(`Component unmounted: ${componentName}`, {
          ...baseContext,
          mountDuration,
        });
      }
    };
  }, [componentName, trackMounts, trackUnmounts]);

  // Track renders
  useEffect(() => {
    renderCount.current += 1;
    
    if (trackRenders && renderCount.current > 1) {
      logger.debug(`Component re-rendered: ${componentName} (render #${renderCount.current})`, baseContext);
    }
  });

  // Logging methods with component context
  const debug = useCallback((message: string, context?: LogContext, data?: any) => {
    logger.debug(message, { ...baseContext, ...context }, data);
  }, [baseContext]);

  const info = useCallback((message: string, context?: LogContext, data?: any) => {
    logger.info(message, { ...baseContext, ...context }, data);
  }, [baseContext]);

  const warn = useCallback((message: string, context?: LogContext, data?: any) => {
    logger.warn(message, { ...baseContext, ...context }, data);
  }, [baseContext]);

  const error = useCallback((message: string, context?: LogContext, error?: Error, data?: any) => {
    logger.error(message, { ...baseContext, ...context }, error, data);
  }, [baseContext]);

  // User interaction tracking
  const trackUserAction = useCallback((action: string, context?: LogContext, data?: any) => {
    logger.trackUserAction(action, { ...baseContext, ...context }, data);
  }, [baseContext]);

  // Form event tracking
  const trackFormEvent = useCallback(
    (formName: string, event: 'submit' | 'error' | 'validation_error', context?: LogContext, data?: any) => {
      logger.trackFormEvent(formName, event, { ...baseContext, ...context }, data);
    },
    [baseContext]
  );

  return {
    debug,
    info,
    warn,
    error,
    trackUserAction,
    trackFormEvent,
    getRenderCount: () => renderCount.current,
    getMountDuration: () => Date.now() - mountTime.current,
  };
}

/**
 * Hook for tracking user interactions (clicks, form submissions, etc.)
 */
export function useUserInteractionTracking(componentName: string, options: UseLoggerOptions = {}) {
  const { trackUserAction } = useLogger({ ...options, componentName });

  const trackClick = useCallback((elementId: string, additionalData?: any) => {
    trackUserAction('click', { elementId }, additionalData);
  }, [trackUserAction]);

  const trackFormSubmit = useCallback((formName: string, formData?: any) => {
    trackUserAction('form_submit', { formName }, formData);
  }, [trackUserAction]);

  const trackNavigation = useCallback((from: string, to: string) => {
    trackUserAction('navigation', { from, to });
  }, [trackUserAction]);

  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    trackUserAction('search', { query, resultsCount });
  }, [trackUserAction]);

  const trackFilter = useCallback((filterType: string, filterValue: string) => {
    trackUserAction('filter', { filterType, filterValue });
  }, [trackUserAction]);

  return {
    trackClick,
    trackFormSubmit,
    trackNavigation,
    trackSearch,
    trackFilter,
  };
}

/**
 * Hook for API call tracking
 */
export function useApiLogger(componentName: string, options: UseLoggerOptions = {}) {
  const { info, error: logError } = useLogger({ ...options, componentName });

  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    method: string,
    url: string,
    context?: LogContext
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      logger.trackApiCall(method, url, 200, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const status = error instanceof Error && 'status' in error ? (error as any).status : 500;
      
      logger.trackApiCall(method, url, status, duration, context);
      logError(`API call failed: ${method} ${url}`, context, error as Error);
      throw error;
    }
  }, [info, logError]);

  return { trackApiCall };
}

/**
 * Hook for form validation and submission tracking
 */
export function useFormLogger(formName: string, options: UseLoggerOptions = {}) {
  const { trackFormEvent } = useLogger(options);

  const trackValidationError = useCallback((field: string, error: string) => {
    trackFormEvent(formName, 'validation_error', { field }, { error });
  }, [formName, trackFormEvent]);

  const trackSubmitAttempt = useCallback((formData?: any) => {
    trackFormEvent(formName, 'submit', undefined, formData);
  }, [formName, trackFormEvent]);

  const trackSubmitError = useCallback((error: Error | string) => {
    trackFormEvent(formName, 'error', undefined, { error: error.toString() });
  }, [formName, trackFormEvent]);

  return {
    trackValidationError,
    trackSubmitAttempt,
    trackSubmitError,
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceLogger(componentName: string, options: UseLoggerOptions = {}) {
  const { info } = useLogger({ ...options, componentName });

  const trackPerformance = useCallback((operationName: string, duration: number, additionalData?: any) => {
    info(`Performance: ${operationName}`, {
      operationType: 'performance',
      operationName,
      duration,
    }, additionalData);
  }, [info]);

  const timeOperation = useCallback(async <T>(
    operation: () => Promise<T> | T,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      trackPerformance(operationName, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      trackPerformance(`${operationName}_error`, duration, { error });
      throw error;
    }
  }, [trackPerformance]);

  return {
    trackPerformance,
    timeOperation,
  };
}
