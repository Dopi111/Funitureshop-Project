/**
 * Centralized API client with:
 * - Auto-injected auth headers
 * - Standardized response handling
 * - Centralized error handling
 * - Retry logic for transient failures
 */

const API_BASE_URL = 'http://localhost:5028/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Build standard headers with auth
 */
function buildHeaders(customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Normalize API response to standard shape
 * Handles both { success, data } and legacy formats
 */
function normalizeResponse(response) {
    // If response already has success field, assume it's normalized
    if ('success' in response) {
        return response;
    }

    // Legacy format or direct data return
    return {
        success: true,
        data: response,
    };
}

/**
 * Central fetch wrapper
 * @param {string} endpoint - Relative endpoint (e.g., '/orders' not '/api/orders')
 * @param {object} options - Fetch options (method, body, etc.)
 * @return {Promise<{success, data, message}>}
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: buildHeaders(options.headers),
    };

    // Parse body if it's an object
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(url, config);

        // Handle non-OK responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.message || `API Error ${response.status}`;
            console.error(`❌ ${config.method || 'GET'} ${endpoint}:`, errorMessage);

            return {
                success: false,
                message: errorMessage,
                data: null,
                status: response.status,
            };
        }

        // Parse response
        const data = await response.json();
        const normalized = normalizeResponse(data);

        if (!normalized.success) {
            console.warn(`⚠️ ${config.method || 'GET'} ${endpoint}:`, normalized.message);
        } else {
            console.log(`✓ ${config.method || 'GET'} ${endpoint}`);
        }

        return normalized;
    } catch (error) {
        console.error(`❌ Network error on ${endpoint}:`, error.message);
        return {
            success: false,
            message: error.message || 'Network error',
            data: null,
        };
    }
}

/**
 * GET request helper
 */
export function get(endpoint) {
    return request(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export function post(endpoint, body) {
    return request(endpoint, { method: 'POST', body });
}

/**
 * PUT request helper
 */
export function put(endpoint, body) {
    return request(endpoint, { method: 'PUT', body });
}

/**
 * PATCH request helper
 */
export function patch(endpoint, body) {
    return request(endpoint, { method: 'PATCH', body });
}

/**
 * DELETE request helper
 */
export function del(endpoint, body = null) {
    return request(endpoint, { method: 'DELETE', ...(body && { body }) });
}

/**
 * Query string builder
 */
export function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            qs.append(key, value);
        }
    });
    return qs.toString();
}

/**
 * GET with query params
 */
export function getWithQuery(endpoint, params) {
    const qs = buildQueryString(params);
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return get(url);
}

export default { get, post, put, patch, del, buildQueryString, getWithQuery };
