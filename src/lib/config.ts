/**
 * Application configuration for API URLs and environment detection
 * 
 * All API calls go through the VITE_API_URL environment variable.
 * In development, Vite's proxy handles routing /api to the backend.
 * In production, this points to the deployed backend URL.
 */

/**
 * Get the API base URL from environment
 */
export const getApiBaseUrl = (): string => {
  // Use VITE_API_URL if set (production / explicit configuration)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // In development with Vite proxy, use relative URLs
  return '';
};

/**
 * Get full API URL for a given endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return baseUrl ? `${baseUrl}${normalizedEndpoint}` : normalizedEndpoint;
};

/**
 * Environment detection
 */
export const isDevelopment = () => import.meta.env.DEV;
export const isProduction = () => import.meta.env.PROD;
