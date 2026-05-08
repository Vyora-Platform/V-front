import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component - Protects routes and handles authentication
 * Prevents re-login issues and provides consistent loading states
 * 
 * Usage:
 * <AuthGuard>
 *   <YourProtectedComponent />
 * </AuthGuard>
 */
export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation(redirectTo);
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Loading component for consistent loading states
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Simple loading spinner for inline use
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-64 mx-auto"></div>
        <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
      </div>
    </div>
  );
}

