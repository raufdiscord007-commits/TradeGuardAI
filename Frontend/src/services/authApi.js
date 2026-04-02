/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import api, { 
  API_BASE_URL, 
  setTokens, 
  clearTokens, 
  getRefreshToken 
} from './api';

/**
 * Initiate registration - sends verification code to email
 * @param {Object} data - { email, password, firstName, lastName }
 * @returns {Promise<Object>} - { success, message, email, pendingData }
 */
export const initiateRegister = async (data) => {
  const response = await api.post('/api/auth/register/init', {
    email: data.email,
    password: data.password,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
  });
  return response;
};

/**
 * Verify registration with 6-digit code
 * @param {Object} data - { email, code, pendingData }
 * @returns {Promise<Object>} - { success, user, accessToken, refreshToken }
 */
export const verifyRegistration = async (data) => {
  const response = await api.post('/api/auth/register/verify', {
    email: data.email,
    code: data.code,
    pendingData: data.pendingData,
  });
  
  if (response.success && response.accessToken) {
    setTokens(response.accessToken, response.refreshToken);
  }
  
  return response;
};

/**
 * Resend verification code
 * @param {Object} data - { email, pendingData }
 * @returns {Promise<Object>}
 */
export const resendVerificationCode = async (data) => {
  return api.post('/api/auth/register/resend', {
    email: data.email,
    pendingData: data.pendingData,
  });
};

/**
 * Login with email and password
 * @param {Object} data - { email, password }
 * @returns {Promise<Object>} - { success, user, accessToken, refreshToken }
 */
export const login = async (data) => {
  const response = await api.post('/api/auth/login', {
    email: data.email,
    password: data.password,
  });
  
  if (response.success && response.accessToken) {
    setTokens(response.accessToken, response.refreshToken);
  }
  
  return response;
};

/**
 * Initiate Google OAuth flow
 * Redirects to Google OAuth page
 */
export const loginWithGoogle = () => {
  window.location.href = `${API_BASE_URL}/api/auth/google`;
};

/**
 * Logout - invalidate tokens
 * @returns {Promise<Object>}
 */
export const logout = async () => {
  const refreshToken = getRefreshToken();
  
  try {
    await api.post('/api/auth/logout', { refreshToken });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  clearTokens();
  return { success: true };
};

/**
 * Get current authenticated user
 * @returns {Promise<Object>} - { success, user }
 */
export const getCurrentUser = async () => {
  return api.get('/api/auth/me');
};

/**
 * Request password reset email
 * @param {Object} data - { email }
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (data) => {
  return api.post('/api/auth/forgot-password', {
    email: data.email,
  });
};

/**
 * Reset password with token
 * @param {Object} data - { email, token, password }
 * @returns {Promise<Object>}
 */
export const resetPassword = async (data) => {
  return api.post('/api/auth/reset-password', {
    email: data.email,
    token: data.token,
    password: data.password,
  });
};

/**
 * Update user profile
 * @param {Object} data - { firstName, lastName }
 * @returns {Promise<Object>}
 */
export const updateProfile = async (data) => {
  return api.put('/api/auth/profile', data);
};

/**
 * Change password (for logged-in users)
 * @param {Object} data - { currentPassword, newPassword }
 * @returns {Promise<Object>}
 */
export const changePassword = async (data) => {
  return api.put('/api/auth/password', {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
};

/**
 * Delete user account
 * @param {Object} data - { password }
 * @returns {Promise<Object>}
 */
export const deleteAccount = async (data) => {
  const response = await api.delete('/api/auth/account', {
    password: data?.password,
  });
  
  if (response.success) {
    clearTokens();
  }
  
  return response;
};

/**
 * Handle OAuth callback - extract tokens from URL
 * @param {URLSearchParams} searchParams
 * @returns {Promise<Object>} - { success, user } or { success: false, error }
 */
export const handleOAuthCallback = async (searchParams) => {
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const error = searchParams.get('error');

  if (error) {
    return { success: false, error: 'OAuth authentication failed' };
  }

  if (!accessToken || !refreshToken) {
    return { success: false, error: 'Missing tokens in callback' };
  }

  // Store tokens
  setTokens(accessToken, refreshToken);

  // Fetch user data
  try {
    const response = await getCurrentUser();
    return { success: true, user: response.user };
  } catch (err) {
    clearTokens();
    return { success: false, error: err.message };
  }
};

// ====================================
// Set Password Flow (for Google-only users)
// ====================================

/**
 * Initiate password setup - sends verification code to email
 * @returns {Promise<Object>}
 */
export const initiateSetPassword = async () => {
  return api.post('/api/auth/set-password/init');
};

/**
 * Verify code and set password
 * @param {Object} data - { code, password }
 * @returns {Promise<Object>}
 */
export const verifySetPassword = async (data) => {
  return api.post('/api/auth/set-password/verify', {
    code: data.code,
    password: data.password,
  });
};

/**
 * Resend verification code for password setup
 * @returns {Promise<Object>}
 */
export const resendSetPasswordCode = async () => {
  return api.post('/api/auth/set-password/resend');
};

// ====================================
// Link Google Account Flow (for email/password users)
// ====================================

/**
 * Initiate Google account linking - gets a link token
 * @returns {Promise<Object>} - { success, linkToken }
 */
export const initiateLinkGoogle = async () => {
  return api.post('/api/auth/link-google/init');
};

/**
 * Redirect to Google OAuth with link token for account linking
 * @param {string} linkToken
 */
export const linkGoogleOAuth = (linkToken) => {
  window.location.href = `${API_BASE_URL}/api/auth/link-google?linkToken=${encodeURIComponent(linkToken)}`;
};

export default {
  initiateRegister,
  verifyRegistration,
  resendVerificationCode,
  login,
  loginWithGoogle,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
  handleOAuthCallback,
  // Set password flow
  initiateSetPassword,
  verifySetPassword,
  resendSetPasswordCode,
  // Link Google flow
  initiateLinkGoogle,
  linkGoogleOAuth,
};
