/**
 * Global project environment + API configuration (Vite + Node/Spring backend)
 */

/**
 * SEPARATED MODE
 * - Frontend runs on Vite (5173)
 * - Backend runs separately (3000 or deployed server)
 *
 * INTEGRATED MODE
 * - Backend serves frontend (e.g., Spring Boot static files, Nginx)
 *
 * We decide this based on whether VITE_API_BASE_URL is provided.
 */

export const isSeparatedMode = (): boolean => {
  return Boolean(import.meta.env.VITE_API_BASE_URL);
};

/**
 * Returns the base URL for API
 * Examples:
 *  - DEV separated:   http://localhost:3000
 *  - PROD integrated: (empty)
 */
export const getApiBaseUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  console.log('🔧 getApiBaseUrl:', {
    'import.meta.env.VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
    'import.meta.env.DEV': import.meta.env.DEV,
    'import.meta.env.MODE': import.meta.env.MODE,
    'result': apiBaseUrl
  });
  return apiBaseUrl;
};

/**
 * Return full API URL for a given endpoint
 * Example: getApiUrl("/users")
 *  -> http://localhost:3000/users     (dev separated)
 *  -> /users                          (prod integrated)
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  console.log('baseUrl', baseUrl);
  console.log('endpoint', endpoint);

  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  return `${baseUrl}${normalizedEndpoint}`;
};

/**
 * Environment helpers
 */
export const isDevelopment = () => import.meta.env.DEV;
export const isProduction = () => import.meta.env.PROD;

/**
 * Optional server config (frontend local dev only)
 */
export const SERVER_CONFIG = {
  port: import.meta.env.PORT || 3000,
  host: 'localhost',
  protocol: 'http',
};
