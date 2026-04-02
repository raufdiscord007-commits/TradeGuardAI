import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import authApi from '../services/authApi';
import { hasTokens, clearTokens } from '../services/api';

export const AuthContext = createContext();

// Tier hierarchy for client-side access control
const TIER_HIERARCHY = {
  FREE: 0,
  PRO: 1,
  API_PLAN: 2,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Registration flow state
  const [pendingRegistration, setPendingRegistration] = useState(null);

  // Fetch current user on mount (if tokens exist)
  useEffect(() => {
    const checkAuth = async () => {
      if (!hasTokens()) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          clearTokens();
        }
      } catch (err) {
        console.error('Failed to get current user:', err);
        clearTokens();
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Periodically refresh user data to catch subscription changes (every 2 minutes)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await authApi.getCurrentUser();
        if (response.success && response.user) {
          // Only update if data has changed to avoid unnecessary re-renders
          const currentPlan = user.subscription?.planTier;
          const newPlan = response.user.subscription?.planTier;
          
          if (currentPlan !== newPlan || 
              user.subscription?.status !== response.user.subscription?.status) {
            console.log('Subscription updated:', { from: currentPlan, to: newPlan });
            setUser(response.user);
          }
        }
      } catch (err) {
        // Silently fail - don't disrupt user experience
        console.error('Background refresh failed:', err);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await authApi.login({ email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.message || 'Login failed' };
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Initiate signup - sends verification code to email
   * Returns pending data needed for verification step
   */
  const initiateSignup = useCallback(async (email, password, firstName = '', lastName = '') => {
    try {
      setError(null);
      const response = await authApi.initiateRegister({ 
        email, 
        password, 
        firstName, 
        lastName 
      });
      
      if (response.success) {
        // Store pending registration data
        setPendingRegistration({
          email: response.email,
          pendingData: response.pendingData,
        });
        return { success: true, email: response.email };
      }
      
      return { success: false, error: response.message || 'Signup failed' };
    } catch (err) {
      const errorMsg = err.message || 'Signup failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Verify registration with 6-digit code
   */
  const verifyRegistration = useCallback(async (code) => {
    if (!pendingRegistration) {
      return { success: false, error: 'No pending registration found' };
    }

    try {
      setError(null);
      const response = await authApi.verifyRegistration({
        email: pendingRegistration.email,
        code,
        pendingData: pendingRegistration.pendingData,
      });
      
      if (response.success && response.user) {
        setUser(response.user);
        setPendingRegistration(null);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.message || 'Verification failed' };
    } catch (err) {
      const errorMsg = err.message || 'Verification failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [pendingRegistration]);

  /**
   * Resend verification code
   */
  const resendVerificationCode = useCallback(async () => {
    if (!pendingRegistration) {
      return { success: false, error: 'No pending registration found' };
    }

    try {
      setError(null);
      const response = await authApi.resendVerificationCode({
        email: pendingRegistration.email,
        pendingData: pendingRegistration.pendingData,
      });
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to resend code';
      return { success: false, error: errorMsg };
    }
  }, [pendingRegistration]);

  /**
   * Cancel pending registration
   */
  const cancelRegistration = useCallback(() => {
    setPendingRegistration(null);
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setUser(null);
    setPendingRegistration(null);
    return { success: true };
  }, []);

  /**
   * Initiate Google OAuth login
   * Redirects to Google OAuth page
   */
  const loginWithGoogle = useCallback(() => {
    authApi.loginWithGoogle();
  }, []);

  /**
   * Handle OAuth callback - extract tokens from URL
   */
  const handleOAuthCallback = useCallback(async (searchParams) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await authApi.handleOAuthCallback(searchParams);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true, user: result.user };
      }
      
      return { success: false, error: result.error || 'OAuth failed' };
    } catch (err) {
      const errorMsg = err.message || 'OAuth failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Request password reset email
   */
  const sendPasswordResetEmail = useCallback(async (email) => {
    try {
      setError(null);
      const response = await authApi.forgotPassword({ email });
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to send reset email';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (email, token, password) => {
    try {
      setError(null);
      const response = await authApi.resetPassword({ email, token, password });
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Password reset failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data) => {
    try {
      setError(null);
      const response = await authApi.updateProfile(data);
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.message || 'Update failed' };
    } catch (err) {
      const errorMsg = err.message || 'Update failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Change password (for logged-in users)
   */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await authApi.changePassword({ currentPassword, newPassword });
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Password change failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(async (password) => {
    try {
      setError(null);
      const response = await authApi.deleteAccount({ password });
      
      if (response.success) {
        setUser(null);
        return { success: true };
      }
      
      return { success: false, error: response.message || 'Delete failed' };
    } catch (err) {
      const errorMsg = err.message || 'Delete failed';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // ====================================
  // Set Password Flow (for Google-only users)
  // ====================================

  /**
   * Initiate password setup - sends verification code to email
   */
  const initiateSetPassword = useCallback(async () => {
    try {
      setError(null);
      const response = await authApi.initiateSetPassword();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to initiate password setup';
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Verify code and set password
   */
  const verifySetPassword = useCallback(async (code, password) => {
    try {
      setError(null);
      const response = await authApi.verifySetPassword({ code, password });
      
      if (response.success) {
        // Refresh user to update hasPassword flag
        await refreshUser();
      }
      
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to set password';
      return { success: false, error: errorMsg };
    }
  }, [refreshUser]);

  /**
   * Resend verification code for password setup
   */
  const resendSetPasswordCode = useCallback(async () => {
    try {
      setError(null);
      const response = await authApi.resendSetPasswordCode();
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Failed to resend code';
      return { success: false, error: errorMsg };
    }
  }, []);

  // ====================================
  // Link Google Account Flow (for email/password users)
  // ====================================

  /**
   * Initiate Google account linking - gets a link token then redirects to Google OAuth
   */
  const linkGoogleAccount = useCallback(async () => {
    try {
      setError(null);
      const response = await authApi.initiateLinkGoogle();
      
      if (response.success && response.linkToken) {
        // Redirect to Google OAuth with the link token
        authApi.linkGoogleOAuth(response.linkToken);
        return { success: true };
      }
      
      return { success: false, error: response.message || 'Failed to initiate Google linking' };
    } catch (err) {
      const errorMsg = err.message || 'Failed to link Google account';
      return { success: false, error: errorMsg };
    }
  }, []);

  // Check if current user is an admin (using role from database)
  const isAdmin = useMemo(() => {
    return user?.role === 'ADMIN';
  }, [user]);

  // Subscription helpers
  const subscription = useMemo(() => {
    return user?.subscription || {
      planTier: 'FREE',
      status: 'ACTIVE',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }, [user]);

  /**
   * Check if user has at least the specified tier
   * @param {string} requiredTier - 'FREE', 'PRO', or 'API_PLAN'
   * @returns {boolean}
   */
  const hasTier = useCallback((requiredTier) => {
    const currentTier = subscription.planTier || 'FREE';
    const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;
    const currentLevel = TIER_HIERARCHY[currentTier] ?? 0;
    
    // Also check if subscription is active
    const isActive = ['ACTIVE', 'TRIALING'].includes(subscription.status);
    
    return isActive && currentLevel >= requiredLevel;
  }, [subscription]);

  /**
   * Check if subscription is active (not canceled or past due)
   */
  const hasActiveSubscription = useMemo(() => {
    return ['ACTIVE', 'TRIALING'].includes(subscription.status);
  }, [subscription]);

  // Create a member-like object for backward compatibility
  // This allows existing components to use member.auth.email, etc.
  const member = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      auth: {
        email: user.email,
      },
      customFields: {
        'first-name': user.firstName,
        'last-name': user.lastName,
      },
      // Direct access for convenience
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      googleId: user.googleId,
      hasPassword: user.hasPassword,
      hasGoogleLinked: user.hasGoogleLinked,
    };
  }, [user]);

  /**
   * Legacy updateMemberAuth wrapper for backward compatibility
   * Old signature: (currentPassword, newEmail, newPassword)
   * Maps to new changePassword function
   */
  const updateMemberAuth = useCallback(async (currentPassword, newEmail, newPassword) => {
    // Email changes are not supported in this implementation
    if (newEmail) {
      return { success: false, error: 'Email changes are not supported. Please contact support.' };
    }
    
    // Handle password change
    if (newPassword) {
      return changePassword(currentPassword, newPassword);
    }
    
    return { success: false, error: 'No update parameters provided' };
  }, [changePassword]);

  /**
   * Legacy updateMemberInfo wrapper for backward compatibility
   * Old signature: (customFields) where customFields is { 'first-name': 'value', 'last-name': 'value' }
   * Maps to new updateProfile function
   */
  const updateMemberInfo = useCallback(async (customFields) => {
    const profileData = {
      firstName: customFields?.['first-name'] || customFields?.firstName,
      lastName: customFields?.['last-name'] || customFields?.lastName,
    };
    return updateProfile(profileData);
  }, [updateProfile]);

  /**
   * Legacy deleteMemberAccount wrapper for backward compatibility
   * Old signature: () - no password required
   * Maps to new deleteAccount function
   */
  const deleteMemberAccount = useCallback(async () => {
    // For Google accounts, no password needed
    if (user?.googleId && !user?.passwordHash) {
      return deleteAccount();
    }
    // For email/password accounts, we'd need to prompt for password
    // but the old interface didn't require it, so we'll just try without
    return deleteAccount();
  }, [deleteAccount, user]);

  const value = {
    // User state
    user,
    member, // Backward compatibility
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin,
    
    // Subscription state
    subscription,
    hasTier,
    hasActiveSubscription,
    
    // Registration flow state
    pendingRegistration,
    
    // Auth methods
    login,
    initiateSignup,
    verifyRegistration,
    resendVerificationCode,
    cancelRegistration,
    logout,
    loginWithGoogle,
    handleOAuthCallback,
    sendPasswordResetEmail,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshUser,
    
    // Account linking methods
    initiateSetPassword,
    verifySetPassword,
    resendSetPasswordCode,
    linkGoogleAccount,
    
    // Legacy method names for backward compatibility
    signup: initiateSignup,
    signupWithGoogle: loginWithGoogle, // Google handles both login/signup
    updateMemberInfo, // Wrapper function
    updateMemberAuth, // Wrapper function
    deleteMemberAccount, // Wrapper function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
