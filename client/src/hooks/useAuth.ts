import { useState, useEffect } from 'react';

/**
 * Enhanced authentication hook with proper refresh handling
 * Solves re-login issues on hard refresh
 * 
 * IMPORTANT: This hook reads directly from localStorage and NEVER clears it
 * except during explicit logout. This ensures vendorId, userId, and userRole
 * persist across page refreshes.
 */
export function useAuth() {
  // Initialize state from localStorage IMMEDIATELY (synchronously)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    return !!(token && userId);
  });

  const [isLoading, setIsLoading] = useState(true);

  const [vendorId, setVendorId] = useState<string | null>(() => {
    return localStorage.getItem('vendorId') || localStorage.getItem('userId');
  });

  const [userId, setUserId] = useState<string | null>(() => {
    return localStorage.getItem('userId');
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    return localStorage.getItem('userRole');
  });

  useEffect(() => {
    // Re-check authentication status after mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUserId = localStorage.getItem('userId');
        const storedVendorId = localStorage.getItem('vendorId') || storedUserId;
        const storedUserRole = localStorage.getItem('userRole');

        console.log('🔍 [useAuth] Checking auth from localStorage:', {
          hasToken: !!token,
          userId: storedUserId,
          vendorId: storedVendorId,
          userRole: storedUserRole
        });

        if (token && storedUserId) {
          setIsAuthenticated(true);
          setUserId(storedUserId);
          setVendorId(storedVendorId);
          setUserRole(storedUserRole);
          console.log('✅ [useAuth] User authenticated');
        } else {
          setIsAuthenticated(false);
          console.log('❌ [useAuth] User not authenticated');
        }
      } catch (error) {
        console.error('❌ [useAuth] Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to auth-related changes
      if (e.key && ['token', 'userId', 'vendorId', 'userRole'].includes(e.key)) {
        console.log('🔄 [useAuth] Storage changed, re-checking auth');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = () => {
    console.log('🚪 [useAuth] EXPLICIT LOGOUT - clearing all auth data from localStorage');
    console.log('🚪 [useAuth] This is the ONLY place that should clear auth data');
    
    // Allow removal of protected keys during logout
    if ((window as any).__allowAuthRemoval) {
      (window as any).__allowAuthRemoval();
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('vendorId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    setIsAuthenticated(false);
    setVendorId(null);
    setUserId(null);
    setUserRole(null);
    
    console.log('✅ [useAuth] Logout complete - all auth data cleared');
  };

  return {
    isAuthenticated,
    isLoading,
    vendorId,
    userId,
    userRole,
    logout,
  };
}

