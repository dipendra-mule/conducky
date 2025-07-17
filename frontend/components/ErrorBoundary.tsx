/**
 * Error Boundary with Integrated Logging
 * 
 * Captures React component errors and sends them to the logging system
 * with comprehensive context for debugging.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, errorId: string) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  componentName?: string;
  userId?: string;
  eventSlug?: string;
  organizationSlug?: string;
  showErrorDetails?: boolean; // For development
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log error with comprehensive context
    logger.error('React component error caught by boundary', {
      componentName: this.props.componentName || 'ErrorBoundary',
      userId: this.props.userId,
      eventSlug: this.props.eventSlug,
      organizationSlug: this.props.organizationSlug,
      errorId,
      componentStack: errorInfo.componentStack || 'unknown',
      errorStack: error.stack || 'unknown',
    }, error, {
      errorInfo,
    });

    // Update state with error info
    this.setState({
      errorInfo,
      errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.state.errorId);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <div className="mx-auto h-12 w-12 text-red-500">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We&apos;ve encountered an unexpected error. Our team has been notified.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-100 border border-gray-300 rounded-md p-4">
                <p className="text-sm text-gray-600">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Please include this ID when contacting support.
                </p>
              </div>

              {this.props.showErrorDetails && process.env.NODE_ENV === 'development' && (
                <details className="bg-red-50 border border-red-200 rounded-md p-4">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 text-xs text-red-700">
                    <div className="mb-2">
                      <strong>Error:</strong>
                      <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                    </div>
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reload Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for programmatically triggering error boundary
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: { [key: string]: unknown }) => {
    logger.error('Manual error trigger', {
      triggerType: 'manual',
    }, error, errorInfo);
    
    // Re-throw to trigger error boundary
    throw error;
  };
}
