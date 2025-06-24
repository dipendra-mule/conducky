import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { UserContext } from '@/pages/_app';

interface User {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
  avatarUrl?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  sessionLoading: boolean;
}

interface UseAuthGuardOptions {
  /**
   * Whether this page requires authentication
   * @default true
   */
  requireAuth?: boolean;
  
  /**
   * Required roles for access (any role in array grants access)
   * @default []
   */
  requiredRoles?: string[];
  
  /**
   * Custom redirect path for unauthenticated users
   * @default '/login'
   */
  redirectTo?: string;
  
  /**
   * Whether to redirect immediately or show login prompt
   * @default false (show login prompt)
   */
  redirectImmediately?: boolean;
}

interface AuthGuardState {
  /** Whether authentication check is complete */
  isAuthLoaded: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether user has required role(s) */
  hasRequiredRole: boolean;
  /** Current user object */
  user: User | null;
  /** Function to trigger login redirect */
  redirectToLogin: () => void;
}

/**
 * Custom hook for handling authentication and authorization
 * 
 * @param options Configuration options for authentication requirements
 * @returns AuthGuardState with authentication status and helper functions
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardState {
  const {
    requireAuth = true,
    requiredRoles = [],
    redirectTo = '/login',
    redirectImmediately = false
  } = options;
  
  const { user, sessionLoading } = useContext(UserContext) as UserContextType;
  const router = useRouter();
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  
  const isAuthenticated = !!user;
  const hasRequiredRole = requiredRoles.length === 0 || 
    (user?.roles && requiredRoles.some(role => user.roles.includes(role)));
  
  // Mark auth as loaded when session loading is complete
  useEffect(() => {
    if (!sessionLoading) {
      setIsAuthLoaded(true);
    }
  }, [sessionLoading]);
  
  // Handle authentication redirect
  const redirectToLogin = () => {
    const currentPath = router.asPath;
    const loginUrl = `${redirectTo}?next=${encodeURIComponent(currentPath)}`;
    router.push(loginUrl);
  };
  
  // Auto-redirect if configured and requirements not met
  useEffect(() => {
    if (!isAuthLoaded || !requireAuth) return;
    
    if (redirectImmediately) {
      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }
      
      if (requiredRoles.length > 0 && !hasRequiredRole) {
        router.push('/dashboard'); // Redirect to default page for insufficient permissions
        return;
      }
    }
  }, [isAuthLoaded, isAuthenticated, hasRequiredRole, redirectImmediately, requireAuth]);
  
  return {
    isAuthLoaded,
    isAuthenticated,
    hasRequiredRole,
    user,
    redirectToLogin
  };
} 