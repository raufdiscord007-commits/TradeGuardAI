/**
 * Admin Middleware
 * Verifies that the requesting user is an authorized admin
 * Works with JWT authentication
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Admin emails for fallback checking (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'anshaal1mill@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email);

/**
 * Extract bearer token from Authorization header
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Verify JWT access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Check if an email is an admin email
 */
export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Middleware to authenticate user and verify admin access
 * Uses JWT token from Authorization header
 */
export const requireAdmin = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }

  // Check admin role from token
  if (decoded.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin privileges required.',
      code: 'ADMIN_ACCESS_DENIED'
    });
  }

  // Attach user info to request
  req.user = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    firstName: decoded.firstName
  };

  // Also set admin info for backwards compatibility
  req.admin = {
    id: decoded.userId,
    email: decoded.email
  };

  next();
};

/**
 * Optional admin check - doesn't block, just adds user info if valid
 */
export const optionalAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded && decoded.role === 'ADMIN') {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName
      };
      req.admin = {
        id: decoded.userId,
        email: decoded.email
      };
    }
  }

  next();
};

export default { requireAdmin, optionalAdmin, isAdminEmail };
