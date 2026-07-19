/**
 * Centralized API client with:
 * - Auto-injected auth headers
 * - Standardized response handling
 * - Centralized error handling
 */

const DEFAULT_API_BASE_URL = '/api';
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

function getAuthToken() {
    return localStorage.getItem('authToken');
}

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

function normalizeResponse(response) {
    if (response && typeof response === 'object' && 'success' in response) {
        return response;
    }

    return {
        success: true,
        data: response,
    };
}

function joinUrl(endpoint) {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }

    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (API_BASE_URL.endsWith('/api') && normalizedEndpoint.startsWith('/api/')) {
        return `${API_BASE_URL}${normalizedEndpoint.slice(4)}`;
    }

    return `${API_BASE_URL}${normalizedEndpoint}`;
}

export function buildUrl(endpoint) {
    return joinUrl(endpoint);
}

async function request(endpoint, options = {}) {
    const config = {
        ...options,
        headers: buildHeaders(options.headers),
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(joinUrl(endpoint), config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData?.message || errorData?.error || `API Error ${response.status}`;
            return {
                success: false,
                message: errorMessage,
                data: null,
                status: response.status,
            };
        }

        const data = await response.json();
        return normalizeResponse(data);
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Network error',
            data: null,
        };
    }
}

export function get(endpoint) {
    return request(endpoint, { method: 'GET' });
}

export function post(endpoint, body) {
    return request(endpoint, { method: 'POST', body });
}

export function put(endpoint, body) {
    return request(endpoint, { method: 'PUT', body });
}

export function patch(endpoint, body) {
    return request(endpoint, { method: 'PATCH', body });
}

export function del(endpoint, body = null) {
    return request(endpoint, { method: 'DELETE', ...(body && { body }) });
}

export function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            qs.append(key, value);
        }
    });
    return qs.toString();
}

export function getWithQuery(endpoint, params) {
    const qs = buildQueryString(params);
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    return get(url);
}

export default { get, post, put, patch, del, buildQueryString, getWithQuery, buildUrl, request };
