// Global Configuration for API calls
// This file ensures that the application works in both local and production environments

/**
 * Dynamically determine the API base URL based on the current location
 * - In development: http://localhost:8181/api/v1
 * - In production: http://ec2-15-206-165-3.ap-south-1.compute.amazonaws.com:8181/api/v1
 * - Or any other host: automatically adapts
 */
const API_CONFIG = {
    // Get the base URL dynamically from the current location
    baseURL: window.location.origin + '/api/v1',
    
    // Alternative: use relative path (recommended for most cases)
    // This works because the frontend and backend are served from the same host
    get relativePath() {
        return '/api/v1';
    },
    
    // Get the full API URL
    getApiUrl(endpoint) {
        // Ensure endpoint starts with /
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
        return this.relativePath + cleanEndpoint;
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
}

// Log configuration on load (useful for debugging)
console.log('🔧 API Configuration initialized:');
console.log('   Current Origin:', window.location.origin);
console.log('   API Base URL:', API_CONFIG.baseURL);
console.log('   Relative Path:', API_CONFIG.relativePath);

