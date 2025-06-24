import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { AccessDenied } from "./AccessDenied";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  /** Component content to render for authenticated users */
  children: React.ReactNode;
  
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean;
  
  /** Required roles for access */
  requiredRoles?: string[];
  
  /** Whether to redirect immediately or show login prompt */
  redirectImmediately?: boolean;
  
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  
  /** Custom login prompt props */
  loginPromptProps?: {
    title?: string;
    message?: string;
    showBackButton?: boolean;
  };
}

/**
 * Authentication guard component that handles login prompts and redirects
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requiredRoles = [],
  redirectImmediately = false,
  loadingComponent,
  loginPromptProps = {}
}: AuthGuardProps) {
  const { 
    isAuthLoaded, 
    isAuthenticated, 
    hasRequiredRole
  } = useAuthGuard({
    requireAuth,
    requiredRoles,
    redirectImmediately
  });

  // Show loading while auth is being determined
  if (!isAuthLoaded) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If auth is not required, always show content
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Show login prompt for unauthenticated users (unless redirecting immediately)
  if (!isAuthenticated && !redirectImmediately) {
    return (
      <AccessDenied
        title={loginPromptProps.title || "Please Log In"}
        message={loginPromptProps.message || "You need to log in to access this page."}
        showBackButton={loginPromptProps.showBackButton}
        showLoginButton={true}
      />
    );
  }

  // Show access denied for authenticated users without required role
  if (isAuthenticated && requiredRoles.length > 0 && !hasRequiredRole) {
    return (
      <AccessDenied
        title="Access Denied"
        message={`You need one of the following roles to access this page: ${requiredRoles.join(', ')}`}
        showLoginButton={false}
        showBackButton={true}
      />
    );
  }

  // Show content for authenticated users with proper access
  if (isAuthenticated && hasRequiredRole) {
    return <>{children}</>;
  }

  // Fallback: if redirectImmediately is true, show loading while redirect happens
  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Redirecting...</p>
        </CardContent>
      </Card>
    </div>
  );
} 