/**
 * Global environment + API configuration
 * Works for:
 * - Local dev frontend (Vite @ 5173)
 * - Production frontend (Cloudflare Pages)
 * - Backend hosted separately (DigitalOcean)
 */

/**
 * Determine separated mode (frontend + backend separate)
 */
export const isSeparatedMode = (): boolean => {
  return Boolean(
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL
  );
};

/**
 * Return API base URL
 * Priority:
 * 1. VITE_API_URL  (main production variable)
 * 2. VITE_API_BASE_URL (optional)
 * 3. localhost:3000 for local dev
 * 4. https://api.vyora.club as final production fallback
 */
export const getApiBaseUrl = (): string => {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? "http://localhost:3000" : "https://api.vyora.club");

  console.log("🔧 getApiBaseUrl:", {
    "VITE_API_URL": import.meta.env.VITE_API_URL,
    "VITE_API_BASE_URL": import.meta.env.VITE_API_BASE_URL,
    result: apiBaseUrl,
  });

  return apiBaseUrl;
};

/**
 * Returns full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  console.log("baseUrl", baseUrl);
  console.log("endpoint", endpoint);

  const normalizedEndpoint = endpoint.startsWith("/")
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
 * Optional server config (frontend only)
 */
export const SERVER_CONFIG = {
  port: import.meta.env.PORT || 3000,
  host: "localhost",
  protocol: "http",
};
