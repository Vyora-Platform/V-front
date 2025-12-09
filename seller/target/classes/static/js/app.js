// Common JavaScript utilities and API configuration

const API_BASE_URL = '/api/v1';

// Utility function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Add Authorization header if token exists
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            // Try to parse error as JSON, but handle cases where it's not JSON
            let errorMessage = `Error: ${response.status} ${response.statusText}`;
            
            try {
                const contentLength = response.headers.get('content-length');
                if (contentLength && contentLength !== '0') {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                }
            } catch (e) {
                // Ignore parsing error, use default message
            }
            
            // Provide more helpful messages for common errors
            if (response.status === 409) {
                errorMessage = '❌ Duplicate entry: This email or phone number already exists. Please use different contact information.';
            } else if (response.status === 400) {
                errorMessage = errorMessage || '❌ Invalid data: Please check all required fields are filled correctly.';
            } else if (response.status === 401) {
                errorMessage = '❌ Session expired: Please login again.';
            } else if (response.status === 403) {
                errorMessage = '❌ Access denied: You don\'t have permission for this action.';
            } else if (response.status === 404) {
                errorMessage = '❌ Not found: The requested resource doesn\'t exist.';
            } else if (response.status >= 500) {
                errorMessage = '❌ Server error: Please try again later or contact support.';
            }
            
            throw new Error(errorMessage);
        }

        // For DELETE requests, return success without trying to parse JSON
        if (method === 'DELETE') {
            return { success: true };
        }

        // For POST/PUT, some endpoints might return 201/204 with no body
        if (response.status === 204) {
            return { success: true };
        }

        // Safely parse JSON response
        const text = await response.text();
        
        // If empty response, return empty object
        if (!text || text.trim().length === 0) {
            console.warn('Empty response from server');
            return { success: true };
        }

        // Try to parse as JSON
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse response as JSON:', text);
            console.error('Parse error:', e);
            throw new Error('Invalid JSON response from server');
        }
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type}`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.style.animation = 'slideInRight 0.3s ease';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const statusClass = status.toLowerCase();
    return `<span class="badge badge-${statusClass}">${status}</span>`;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

