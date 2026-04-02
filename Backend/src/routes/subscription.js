/**
 * Subscription Routes - Handle Stripe subscription endpoints
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const stripeService = require('../services/stripeService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/subscription/config
 * Check if Stripe is configured (public)
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    configured: stripeService.isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

/**
 * GET /api/subscription/plans
 * Get available subscription plans (public)
 */
router.get('/plans', (req, res) => {
  try {
    const plans = stripeService.getPlans();
    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      message: error.message,
    });
  }
});

/**
 * GET /api/subscription/status
 * Get current user's subscription status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await stripeService.getSubscriptionStatus(req.user.userId);
    res.json({
      success: true,
      subscription: status,
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription status',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscription/create-checkout-session
 * Create a Stripe Checkout session for subscription
 */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planTier, billingInterval = 'monthly' } = req.body;

    if (!planTier) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Plan tier is required',
      });
    }

    if (!['PRO', 'API_PLAN'].includes(planTier)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid plan tier. Must be PRO or API_PLAN',
      });
    }

    if (!['monthly', 'yearly'].includes(billingInterval)) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid billing interval. Must be monthly or yearly',
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User account not found',
      });
    }

    const session = await stripeService.createCheckoutSession(
      req.user.userId,
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      planTier,
      billingInterval
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscription/create-portal-session
 * Create a Stripe Customer Portal session for subscription management
 */
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const session = await stripeService.createPortalSession(req.user.userId);

    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscription/cancel
 * Cancel the current subscription
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { cancelImmediately = false } = req.body;
    
    const result = await stripeService.cancelSubscription(req.user.userId, cancelImmediately);
    
    res.json({
      success: true,
      message: cancelImmediately 
        ? 'Subscription canceled immediately'
        : 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events
 * NOTE: This endpoint uses raw body parsing (configured in server.js)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    const event = stripeService.verifyWebhookSignature(req.body, signature);
    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: 'Webhook error',
      message: error.message,
    });
  }
});

/**
 * GET /api/subscription/verify-session
 * Verify a checkout session after redirect and sync with Stripe
 */
router.get('/verify-session', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    // Verify and sync the checkout session with Stripe
    const syncedSubscription = await stripeService.verifyAndSyncCheckoutSession(
      session_id,
      req.user.userId
    );

    if (syncedSubscription) {
      res.json({
        success: true,
        subscription: syncedSubscription,
        message: 'Subscription activated successfully',
      });
    } else {
      // Fallback to current status if sync failed
      const status = await stripeService.getSubscriptionStatus(req.user.userId);
      res.json({
        success: true,
        subscription: status,
      });
    }
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify session',
      message: error.message,
    });
  }
});

module.exports = router;
