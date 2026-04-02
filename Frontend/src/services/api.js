/**
 * API Configuration and Axios Instance
 * Handles authentication, token refresh, and request/response interceptors
 */

/**
 * Get API base URL - centralized logic for all API calls
 */
export const getApiBaseUrl = () => {
  const viteUrl = import.meta.env.VITE_API_URL;
  if (viteUrl === 'RUNTIME_ORIGIN') {
    return ''; // Empty string = relative URLs (same origin)
  }
  return viteUrl || 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Get stored access token
 */
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens
 */
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * Clear tokens (logout)
 */
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if user has stored tokens
 */
export const hasTokens = () => {
  return !!getAccessToken();
};

/**
 * Make an authenticated API request
 * Automatically attaches auth header and handles token refresh
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth header if token exists
  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && !options._isRetry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        return apiRequest(endpoint, { ...options, _isRetry: true });
      }
      // Refresh failed - clear tokens and throw
      clearTokens();
      throw new Error('Session expired. Please log in again.');
    }

    // Parse response
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
};

/**
 * Refresh the access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

/**
 * Helper methods for common HTTP methods
 */
export const api = {
  get: (endpoint, options = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  put: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
  
  delete: (endpoint, body, options = {}) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'DELETE',
      ...(body && { body: JSON.stringify(body) })
    }),
};

export { API_BASE_URL };
export default api;
