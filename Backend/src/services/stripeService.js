/**
 * Stripe Service - Handles all Stripe payment operations
 * Supports both Test and Live modes based on env configuration
 */

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Validate Stripe configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured - payment features will be disabled');
}

// Initialize Stripe with secret key
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Detect if we're in live mode
const isLiveMode = STRIPE_SECRET_KEY?.startsWith('sk_live_');
if (isLiveMode) {
  console.log('🔴 Stripe is running in LIVE mode');
} else if (STRIPE_SECRET_KEY) {
  console.log('🟡 Stripe is running in TEST mode');
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Plan configuration - prices in cents for Stripe
const PLANS = {
  FREE: {
    name: 'Free',
    tier: 'FREE',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Real-time cryptocurrency data',
      'Learning platform access',
      'Chart patterns library',
      'Basic portfolio tracking',
      'Community support',
    ],
  },
  PRO: {
    name: 'Pro',
    tier: 'PRO',
    monthlyPrice: 2900, // $29.00
    yearlyPrice: 23900, // $239.00/year ($19.92/month)
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
    features: [
      'Everything in Free plan',
      'AI-powered predictions',
      'Confidence scores & analysis',
      'Advanced technical indicators',
      'Priority email support',
    ],
  },
  API_PLAN: {
    name: 'API Access',
    tier: 'API_PLAN',
    monthlyPrice: 9900, // $99.00
    yearlyPrice: 95000, // $950.00/year ($79.17/month)
    stripePriceIdMonthly: process.env.STRIPE_API_MONTHLY_PRICE_ID,
    stripePriceIdYearly: process.env.STRIPE_API_YEARLY_PRICE_ID,
    features: [
      'Everything in Pro plan',
      'Full API access',
      'Custom integrations',
      'Rate limit: 10,000 req/day',
      'Dedicated support',
    ],
  },
};

/**
 * Check if Stripe is properly configured
 */
const isStripeConfigured = () => {
  return !!stripe;
};

/**
 * Get or create a Stripe customer for a user
 */
const getOrCreateCustomer = async (userId, email, name) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
  }

  // Check if user already has a subscription with a Stripe customer
  const existingSubscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existingSubscription?.stripeCustomerId) {
    // Verify the customer still exists in Stripe (handles live/test mode switch)
    try {
      await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
      return existingSubscription.stripeCustomerId;
    } catch (error) {
      // Customer doesn't exist (likely switched between live/test mode)
      // Clear the old customer ID and create a new one
      console.log(`Stripe customer ${existingSubscription.stripeCustomerId} not found, creating new one`);
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  // Create or update subscription record with customer ID
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      planTier: 'FREE',
      status: 'ACTIVE',
    },
    update: {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });

  return customer.id;
};

/**
 * Create a Stripe Checkout session for subscription
 */
const createCheckoutSession = async (userId, email, name, planTier, billingInterval = 'monthly') => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
  }

  if (!PLANS[planTier]) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  const plan = PLANS[planTier];
  
  if (planTier === 'FREE') {
    throw new Error('Free plan does not require payment');
  }

  const priceId = billingInterval === 'yearly' 
    ? plan.stripePriceIdYearly 
    : plan.stripePriceIdMonthly;

  if (!priceId) {
    throw new Error(`Price ID not configured for ${planTier} ${billingInterval} plan`);
  }

  const customerId = await getOrCreateCustomer(userId, email, name);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${FRONTEND_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/pricing?canceled=true`,
    metadata: {
      userId,
      planTier,
      billingInterval,
    },
    subscription_data: {
      metadata: {
        userId,
        planTier,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
};

/**
 * Create a Stripe Customer Portal session for subscription management
 */
const createPortalSession = async (userId) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this user');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${FRONTEND_URL}/profile`,
  });

  return session;
};

/**
 * Get user's current subscription status
 */
const getSubscriptionStatus = async (userId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    // Return default FREE tier for users without subscription record
    return {
      planTier: 'FREE',
      status: 'ACTIVE',
      features: PLANS.FREE.features,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    planTier: subscription.planTier,
    status: subscription.status,
    features: PLANS[subscription.planTier]?.features || PLANS.FREE.features,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  };
};

/**
 * Handle Stripe webhook events
 */
const handleWebhookEvent = async (event) => {
  console.log(`Processing webhook event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionCanceled(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

/**
 * Handle successful checkout
 */
const handleCheckoutComplete = async (session) => {
  const { userId, planTier } = session.metadata;
  
  if (!userId || !planTier) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log(`Checkout complete for user ${userId}, plan: ${planTier}`);
  
  // Subscription will be fully activated via subscription.created event
};

/**
 * Handle subscription creation/update from Stripe
 */
const handleSubscriptionUpdate = async (stripeSubscription) => {
  const { userId, planTier } = stripeSubscription.metadata;
  
  if (!userId) {
    console.error('Missing userId in subscription metadata:', stripeSubscription.id);
    return;
  }

  // Map Stripe status to our status
  const statusMap = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid: 'PAST_DUE',
  };

  const status = statusMap[stripeSubscription.status] || 'ACTIVE';

  // Upsert subscription record
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planTier: planTier || 'PRO',
      status,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price?.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    update: {
      planTier: planTier || undefined,
      status,
      stripeCustomerId: stripeSubscription.customer,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price?.id,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  console.log(`Subscription updated for user ${userId}: ${status}, tier: ${planTier}`);
};

/**
 * Handle subscription cancellation
 */
const handleSubscriptionCanceled = async (stripeSubscription) => {
  const { userId } = stripeSubscription.metadata;
  
  if (!userId) {
    // Try to find by stripeSubscriptionId
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELED',
          planTier: 'FREE',
        },
      });
      console.log(`Subscription canceled for user ${subscription.userId}`);
    }
    return;
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELED',
      planTier: 'FREE',
    },
  });

  console.log(`Subscription canceled for user ${userId}`);
};

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (invoice) => {
  const customerId = invoice.customer;
  
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE' },
    });
    console.log(`Payment succeeded, subscription activated for user ${subscription.userId}`);
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;
  
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });
    console.log(`Payment failed, subscription past due for user ${subscription.userId}`);
  }
};

/**
 * Cancel a subscription
 */
const cancelSubscription = async (userId, cancelImmediately = false) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  if (cancelImmediately) {
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  return { success: true };
};

/**
 * Get available plans
 */
const getPlans = () => {
  return Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    ...plan,
    monthlyPriceDisplay: plan.monthlyPrice === 0 ? 'Free' : `$${(plan.monthlyPrice / 100).toFixed(0)}`,
    yearlyPriceDisplay: plan.yearlyPrice === 0 ? 'Free' : `$${(plan.yearlyPrice / 100).toFixed(0)}`,
    yearlySavings: plan.monthlyPrice > 0 
      ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
      : 0,
  }));
};

/**
 * Verify Stripe webhook signature
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification');
    return JSON.parse(payload);
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

/**
 * Verify and sync a checkout session (for when webhooks aren't available)
 * This retrieves the session from Stripe and updates the local database
 */
const verifyAndSyncCheckoutSession = async (sessionId, userId) => {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.items.data.price'],
    });

    console.log('[VERIFY SESSION] Session status:', session.status, 'Payment status:', session.payment_status);

    // Check if the session was successful
    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      console.log('[VERIFY SESSION] Session not complete or not paid');
      return null;
    }

    // Get subscription details
    const stripeSubscription = session.subscription;
    if (!stripeSubscription) {
      console.log('[VERIFY SESSION] No subscription found in session');
      return null;
    }

    // Determine the plan tier from metadata or price
    const planTier = session.metadata?.planTier || stripeSubscription.metadata?.planTier || 'PRO';
    
    console.log('[VERIFY SESSION] Updating subscription:', {
      userId,
      planTier,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status,
    });

    // Upsert subscription record
    const updatedSubscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planTier: planTier,
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'TRIALING',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items?.data[0]?.price?.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      update: {
        planTier: planTier,
        status: stripeSubscription.status === 'active' ? 'ACTIVE' : 'TRIALING',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items?.data[0]?.price?.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    console.log('[VERIFY SESSION] Subscription updated successfully:', updatedSubscription.planTier);

    return {
      planTier: updatedSubscription.planTier,
      status: updatedSubscription.status,
      features: PLANS[updatedSubscription.planTier]?.features || PLANS.FREE.features,
      currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error('[VERIFY SESSION] Error:', error);
    throw error;
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  handleWebhookEvent,
  cancelSubscription,
  getPlans,
  verifyWebhookSignature,
  verifyAndSyncCheckoutSession,
  isStripeConfigured,
  PLANS,
};
