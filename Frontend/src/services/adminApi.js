/**
 * Admin API Service
 * Handles all admin-related API calls with proper authentication
 */

import { getAccessToken, refreshAccessToken, clearTokens } from './api';

import { getApiBaseUrl } from './api';

const API_BASE_URL = getApiBaseUrl();

/**
 * Make an authenticated admin API request
 * Automatically attaches auth header and handles token refresh
 */
export const adminApiRequest = async (endpoint, options = {}) => {
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
        return adminApiRequest(endpoint, { ...options, _isRetry: true });
      }
      // Refresh failed - clear tokens and throw
      clearTokens();
      throw new Error('Session expired. Please log in again.');
    }

    // Handle 403 - not authorized
    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
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
 * Admin API helper methods
 */
export const adminApi = {
  get: (endpoint) => adminApiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => adminApiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  
  put: (endpoint, body) => adminApiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint) => adminApiRequest(endpoint, { method: 'DELETE' }),
};

// ============ USER MANAGEMENT ============

/**
 * Get list of all users with pagination and search
 */
export const getUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return adminApi.get(`/api/admin/members${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a specific user by ID
 */
export const getUser = async (userId) => {
  return adminApi.get(`/api/admin/members/${userId}`);
};

/**
 * Update a user
 */
export const updateUser = async (userId, data) => {
  return adminApi.put(`/api/admin/members/${userId}`, data);
};

/**
 * Delete a user
 */
export const deleteUser = async (userId) => {
  return adminApi.delete(`/api/admin/members/${userId}`);
};

// ============ CONTENT MANAGEMENT ============

/**
 * Get articles with pagination
 */
export const getArticles = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return adminApi.get(`/api/admin/articles${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a specific article
 */
export const getArticle = async (id) => {
  return adminApi.get(`/api/admin/articles/${id}`);
};

/**
 * Create an article
 */
export const createArticle = async (data) => {
  return adminApi.post('/api/admin/articles', data);
};

/**
 * Update an article
 */
export const updateArticle = async (id, data) => {
  return adminApi.put(`/api/admin/articles/${id}`, data);
};

/**
 * Delete an article
 */
export const deleteArticle = async (id) => {
  return adminApi.delete(`/api/admin/articles/${id}`);
};

/**
 * Get patterns with pagination
 */
export const getPatterns = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return adminApi.get(`/api/admin/patterns${queryString ? `?${queryString}` : ''}`);
};

/**
 * Get a specific pattern
 */
export const getPattern = async (id) => {
  return adminApi.get(`/api/admin/patterns/${id}`);
};

/**
 * Create a pattern
 */
export const createPattern = async (data) => {
  return adminApi.post('/api/admin/patterns', data);
};

/**
 * Update a pattern
 */
export const updatePattern = async (id, data) => {
  return adminApi.put(`/api/admin/patterns/${id}`, data);
};

/**
 * Delete a pattern
 */
export const deletePattern = async (id) => {
  return adminApi.delete(`/api/admin/patterns/${id}`);
};

// ============ AUDIT LOGS ============

/**
 * Get audit logs with pagination
 */
export const getAuditLogs = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return adminApi.get(`/api/admin/logs${queryString ? `?${queryString}` : ''}`);
};

export default adminApi;
