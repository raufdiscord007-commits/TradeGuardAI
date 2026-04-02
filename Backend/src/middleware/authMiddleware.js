const { verifyAccessToken, extractBearerToken } = require('../utils/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tier hierarchy for subscription-based access control
const TIER_HIERARCHY = {
  FREE: 0,
  PRO: 1,
  API_PLAN: 2,
};

/**
 * Middleware to authenticate JWT access token
 * Attaches user info to req.user if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No access token provided',
      });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Access token is invalid or expired',
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't reject if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName,
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Middleware to require admin role
 * Must be used after authenticateToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required',
    });
  }

  next();
};

/**
 * Middleware to verify user exists and is active
 * Use after authenticateToken for sensitive operations
 */
const verifyUserExists = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid user session',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, role: true, emailVerified: true },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Your account may have been deleted',
      });
    }

    // Update req.user with fresh data
    req.user = {
      ...req.user,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    console.error('Verify user error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while verifying user',
    });
  }
};

/**
 * Middleware to require a minimum subscription tier
 * Must be used after authenticateToken
 * @param {string} requiredTier - Minimum tier required ('FREE', 'PRO', or 'API_PLAN')
 */
const requireSubscription = (requiredTier) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource',
        });
      }

      // Get user's subscription
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.userId },
      });

      // Default to FREE tier if no subscription record exists
      const userTier = subscription?.planTier || 'FREE';
      const subscriptionStatus = subscription?.status || 'ACTIVE';

      // Check if subscription is active
      if (subscription && !['ACTIVE', 'TRIALING'].includes(subscriptionStatus)) {
        return res.status(403).json({
          error: 'Subscription inactive',
          message: 'Your subscription is not active. Please update your payment method.',
          code: 'SUBSCRIPTION_INACTIVE',
          redirectTo: '/pricing',
        });
      }

      // Check tier hierarchy
      const requiredLevel = TIER_HIERARCHY[requiredTier] ?? 0;
      const userLevel = TIER_HIERARCHY[userTier] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: `This feature requires a ${requiredTier.replace('_', ' ')} subscription`,
          code: 'UPGRADE_REQUIRED',
          requiredTier,
          currentTier: userTier,
          redirectTo: '/pricing',
        });
      }

      // Attach subscription info to request
      req.subscription = {
        planTier: userTier,
        status: subscriptionStatus,
        currentPeriodEnd: subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
      };

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'An error occurred while checking subscription',
      });
    }
  };
};

/**
 * Optional subscription middleware - attaches subscription data but doesn't block
 * Use after authenticateToken when you want subscription data but don't require it
 */
const attachSubscription = async (req, res, next) => {
  try {
    if (req.user?.userId) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.userId },
      });

      req.subscription = {
        planTier: subscription?.planTier || 'FREE',
        status: subscription?.status || 'ACTIVE',
        currentPeriodEnd: subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd,
      };
    }
    next();
  } catch (error) {
    console.error('Attach subscription error:', error);
    // Don't fail, just continue without subscription data
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  verifyUserExists,
  requireSubscription,
  attachSubscription,
  TIER_HIERARCHY,
};
