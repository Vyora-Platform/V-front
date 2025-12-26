import { useState, useEffect } from 'react';

/**
 * Hook to get the current vendor ID from localStorage
 * Returns the vendorId or null if not found
 * 
 * IMPORTANT: vendorId is different from userId!
 * - userId is set after signup
 * - vendorId is set after onboarding completion
 * 
 * This hook properly handles:
 * - Initial load (returns null first, then updates with actual value)
 * - Hard refresh (waits for localStorage to be available)
 * - Navigation between pages (maintains value across components)
 */
export function useVendorId(): string | null {
  const [vendorId, setVendorId] = useState<string | null>(() => {
    // IMPORTANT: Don't fallback to userId - vendorId is different!
    // vendorId is only set after onboarding is complete
    return localStorage.getItem('vendorId');
  });

  useEffect(() => {
    // Double-check after mount to handle any edge cases
    const id = localStorage.getItem('vendorId');
    if (id !== vendorId) {
      setVendorId(id);
    }
  }, [vendorId]);

  return vendorId;
}

/**
 * Synchronously get vendor ID from localStorage
 * Use this in API calls or when you need immediate access
 * Returns null if not found (doesn't throw error)
 * 
 * IMPORTANT: vendorId is different from userId!
 * - userId is set after signup
 * - vendorId is set after onboarding completion
 */
export function getVendorId(): string | null {
  const vendorId = localStorage.getItem('vendorId');
  
  if (!vendorId) {
    // This is expected if user hasn't completed onboarding yet
    console.log('📝 No vendor ID found - user may need to complete onboarding');
    return null;
  }
  
  return vendorId;
}

/**
 * Get vendor ID and throw error if not found
 * Use this when vendor ID is required
 */
export function getVendorIdOrThrow(): string {
  const vendorId = getVendorId();
  if (!vendorId) {
    throw new Error('Vendor ID not found. Please login.');
  }
  return vendorId;
}

/**
 * Get user ID from localStorage
 * Returns null if not found (doesn't throw error)
 */
export function getUserId(): string | null {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.warn('⚠️ No user ID found in localStorage. User may not be logged in.');
    return null;
  }
  return userId;
}

/**
 * Get user ID and throw error if not found
 * Use this when user ID is required
 */
export function getUserIdOrThrow(): string {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User ID not found. Please login.');
  }
  return userId;
}

/**
 * Get user role from localStorage
 */
export function getUserRole(): string {
  const role = localStorage.getItem('userRole');
  return role || 'vendor';
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('userId');
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuth(): void {
  localStorage.removeItem('userId');
  localStorage.removeItem('vendorId');
  localStorage.removeItem('userRole');
}

