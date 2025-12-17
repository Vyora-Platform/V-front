/**
 * Application configuration for API URLs and environment detection
 */

// Detect if we're in development separated mode (client on different port than server)
const isSeparatedMode = () => {
  // Check if we're running on a different port than the server (5173 vs 3000)
  // This indicates separated development mode
  if (typeof window === 'undefined') return false;

  return window.location.port === '5173';
};

// Get the API base URL based on environment
export const getApiBaseUrl = (): string => {
  if (isSeparatedMode()) {
    // In separated mode, client runs on 5173, server on 3000
    return 'http://localhost:3000';
  }

  // In integrated mode or production, use relative URLs
  return '';
};

// Get full API URL for a given endpoint
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const separated = isSeparatedMode();

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Return full URL for separated mode, relative for integrated mode
  const fullUrl = baseUrl ? `${baseUrl}${normalizedEndpoint}` : normalizedEndpoint;

  console.log('🔗 getApiUrl:', {
    endpoint,
    normalizedEndpoint,
    baseUrl,
    separated,
    fullUrl,
    port: typeof window !== 'undefined' ? window.location.port : 'N/A'
  });

  return fullUrl;
};

// Environment detection
export const isDevelopment = () => {
  return import.meta.env.DEV;
};

export const isProduction = () => {
  return import.meta.env.PROD;
};

// Server configuration
export const SERVER_CONFIG = {
  port: isSeparatedMode() ? 3000 : (import.meta.env.PORT || 3000),
  host: 'localhost',
  protocol: 'http',
};
