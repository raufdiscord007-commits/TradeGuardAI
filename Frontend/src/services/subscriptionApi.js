/**
 * Subscription API Service
 * Handles all subscription-related API calls to the backend
 */

import { api } from './api';

const SUBSCRIPTION_BASE = '/api/subscription';

/**
 * Check if Stripe is configured on the backend
 * @returns {Promise<{success: boolean, configured: boolean, publishableKey: string|null}>}
 */
export const getStripeConfig = async () => {
  try {
    const response = await api.get(`${SUBSCRIPTION_BASE}/config`);
    return response;
  } catch (error) {
    console.error('Failed to fetch Stripe config:', error);
    return { success: false, configured: false, publishableKey: null };
  }
};

/**
 * Get available subscription plans
 * @returns {Promise<{success: boolean, plans: Array}>}
 */
export const getPlans = async () => {
  try {
    const response = await api.get(`${SUBSCRIPTION_BASE}/plans`);
    return response;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    throw error;
  }
};

/**
 * Get current user's subscription status
 * @returns {Promise<{success: boolean, subscription: Object}>}
 */
export const getSubscriptionStatus = async () => {
  try {
    const response = await api.get(`${SUBSCRIPTION_BASE}/status`);
    return response;
  } catch (error) {
    console.error('Failed to fetch subscription status:', error);
    throw error;
  }
};

/**
 * Create a Stripe Checkout session for subscription
 * @param {string} planTier - 'PRO' or 'API_PLAN'
 * @param {string} billingInterval - 'monthly' or 'yearly'
 * @returns {Promise<{success: boolean, sessionId: string, url: string}>}
 */
export const createCheckoutSession = async (planTier, billingInterval = 'monthly') => {
  try {
    const response = await api.post(`${SUBSCRIPTION_BASE}/create-checkout-session`, {
      planTier,
      billingInterval,
    });
    return response;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
};

/**
 * Create a Stripe Customer Portal session for subscription management
 * @returns {Promise<{success: boolean, url: string}>}
 */
export const createPortalSession = async () => {
  try {
    const response = await api.post(`${SUBSCRIPTION_BASE}/create-portal-session`);
    return response;
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {boolean} cancelImmediately - Whether to cancel immediately or at period end
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const cancelSubscription = async (cancelImmediately = false) => {
  try {
    const response = await api.post(`${SUBSCRIPTION_BASE}/cancel`, {
      cancelImmediately,
    });
    return response;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw error;
  }
};

/**
 * Verify a checkout session after successful payment
 * @param {string} sessionId - Stripe session ID from URL
 * @returns {Promise<{success: boolean, subscription: Object}>}
 */
export const verifyCheckoutSession = async (sessionId) => {
  try {
    const response = await api.get(`${SUBSCRIPTION_BASE}/verify-session?session_id=${sessionId}`);
    return response;
  } catch (error) {
    console.error('Failed to verify session:', error);
    throw error;
  }
};

/**
 * Redirect to Stripe Checkout
 * @param {string} planTier - 'PRO' or 'API_PLAN'
 * @param {string} billingInterval - 'monthly' or 'yearly'
 */
export const redirectToCheckout = async (planTier, billingInterval = 'monthly') => {
  const response = await createCheckoutSession(planTier, billingInterval);
  
  if (response.success && response.url) {
    window.location.href = response.url;
  } else {
    throw new Error(response.message || 'Failed to create checkout session');
  }
};

/**
 * Redirect to Stripe Customer Portal
 */
export const redirectToPortal = async () => {
  const response = await createPortalSession();
  
  if (response.success && response.url) {
    window.location.href = response.url;
  } else {
    throw new Error(response.message || 'Failed to create portal session');
  }
};

const subscriptionApi = {
  getStripeConfig,
  getPlans,
  getSubscriptionStatus,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  verifyCheckoutSession,
  redirectToCheckout,
  redirectToPortal,
};

export default subscriptionApi;
