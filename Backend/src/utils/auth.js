const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Environment variables with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if match
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate an access token
 * @param {Object} user - User object with id, email, role
 * @returns {string} - JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName || null,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a refresh token
 * @param {Object} user - User object with id
 * @returns {string} - JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify an access token
 * @param {string} token - JWT access token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a 6-digit verification code
 * @returns {string} - 6-digit code
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure random token for password reset
 * @returns {string} - Random hex token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Get expiry date for verification code (10 minutes)
 * @returns {Date}
 */
const getCodeExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

/**
 * Get expiry date for password reset token (1 hour)
 * @returns {Date}
 */
const getResetTokenExpiry = () => {
  return new Date(Date.now() + 60 * 60 * 1000);
};

/**
 * Get expiry date for refresh token (7 days)
 * @returns {Date}
 */
const getRefreshTokenExpiry = () => {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

/**
 * Extract bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password 
 * @returns {{ valid: boolean, message: string }}
 */
const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, message: 'Password is valid' };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateVerificationCode,
  generateResetToken,
  getCodeExpiry,
  getResetTokenExpiry,
  getRefreshTokenExpiry,
  extractBearerToken,
  isValidEmail,
  validatePassword,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
};
