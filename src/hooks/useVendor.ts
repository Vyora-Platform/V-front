import { useState, useEffect } from 'react';

/**
 * Hook to get the current vendor ID from localStorage
 * Returns the vendorId or null if not found
 * Falls back to userId if vendorId is not set (since user IS vendor)
 * 
 * This hook properly handles:
 * - Initial load (returns null first, then updates with actual value)
 * - Hard refresh (waits for localStorage to be available)
 * - Navigation between pages (maintains value across components)
 */
export function useVendorId(): string | null {
  const [vendorId, setVendorId] = useState<string | null>(() => {
    // Initialize immediately on first render to avoid flashing
    return localStorage.getItem('vendorId') || localStorage.getItem('userId') || null;
  });

  useEffect(() => {
    // Double-check after mount to handle any edge cases
    const id = localStorage.getItem('vendorId') || localStorage.getItem('userId');
    if (id !== vendorId) {
      setVendorId(id);
    }
  }, [vendorId]);

  return vendorId;
}

/**
 * Synchronously get vendor ID from localStorage
 * Use this in API calls or when you need immediate access
 * Falls back to userId if vendorId is not set (since user IS vendor)
 * Returns null if not found (doesn't throw error)
 */
export function getVendorId(): string | null {
  // First try to get vendorId (set after onboarding/login)
  let vendorId = localStorage.getItem('vendorId');
  
  // Fallback to userId if vendorId not found (user IS vendor)
  if (!vendorId) {
    vendorId = localStorage.getItem('userId');
    if (vendorId) {
      console.log('📝 Using userId as vendorId:', vendorId);
    }
  }
  
  if (!vendorId) {
    console.warn('⚠️ No vendor ID found in localStorage. User may not be logged in.');
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

