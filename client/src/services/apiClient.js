/**
 * DEVVERSE — Centralized API Client
 *
 * Lightweight, fetch-based HTTP client for making API requests to the backend.
 * Integrates with Vite's `/api` proxy in development and same-origin `/api` in production.
 *
 * Features:
 *   - Automatic `/api` prefix handling.
 *   - Standard JSON request/response headers.
 *   - Structured ApiError class containing status, code, message, and validation details.
 *   - Clean network error and offline handling.
 */

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} status
   * @param {string} code
   * @param {Array} [details=[]]
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = '/api';

/**
 * Core request dispatcher.
 *
 * @param {string} endpoint - Path relative to /api (e.g. '/projects')
 * @param {Object} [options={}]
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const { params, headers = {}, body, ...customConfig } = options;

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Append query parameters if provided
  if (params && typeof params === 'object') {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const config = {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...headers,
    },
    ...customConfig,
  };

  if (body !== undefined) {
    config.headers['Content-Type'] = 'application/json';
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new ApiError(
      'Unable to connect to DevVerse API server. Please check your network or verify the backend is running.',
      0,
      'NETWORK_ERROR'
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with HTTP ${response.status}`;
    const errorCode = data?.code || 'API_ERROR';
    const errorDetails = data?.details || [];
    throw new ApiError(errorMsg, response.status, errorCode, errorDetails);
  }

  return data;
}

export const apiClient = {
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  },
  post(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'POST', body });
  },
  patch(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body });
  },
  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
