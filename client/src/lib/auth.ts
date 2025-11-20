/**
 * Authentication utilities for JWT validation
 */

import { getApiUrl } from './config';

/**
 * Validates the JWT token with the backend
 * @returns {Promise<boolean>} True if token is valid, false otherwise
 */
export async function validateToken(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('🔒 [Auth] No token found in localStorage');
      return false;
    }

    // Call the backend to validate the token
    const response = await fetch(getApiUrl('/api/auth/me'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ [Auth] Token is valid:', data.user?.email);
      return true;
    } else {
      console.warn('❌ [Auth] Token validation failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ [Auth] Token validation error:', error);
    return false;
  }
}

/**
 * Clears all authentication data from localStorage
 */
export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('vendorId');
  localStorage.removeItem('userRole');
  console.log('🧹 [Auth] Cleared all auth data from localStorage');
}

/**
 * Checks if user has valid authentication
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  
  // First check if basic auth data exists
  if (!token || !userId) {
    return false;
  }
  
  // IMPORTANT: Don't clear auth data automatically on validation failure
  // Only clear on explicit logout. This prevents data loss on refresh.
  // The backend will reject invalid tokens anyway.
  
  // Just check if token exists - let backend handle validation
  return true;
}

/**
 * Gets the current user's JWT token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * Gets the current user's ID
 */
export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

/**
 * Gets the current user's role
 */
export function getUserRole(): string | null {
  return localStorage.getItem('userRole');
}

/**
 * Gets the current vendor ID (if user is a vendor)
 */
export function getVendorId(): string | null {
  return localStorage.getItem('vendorId');
}

