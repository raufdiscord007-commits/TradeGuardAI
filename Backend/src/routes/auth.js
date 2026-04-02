const express = require('express');
const passport = require('passport');
const router = express.Router();

const {
  initiateRegistration,
  verifyRegistration,
  resendVerificationCode,
  login,
  googleCallback,
  refreshAccessToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  deleteAccount,
  initiateSetPassword,
  verifySetPassword,
  resendSetPasswordCode,
  initiateLinkGoogle,
} = require('../controllers/authController');

const { authenticateToken, verifyUserExists } = require('../middleware/authMiddleware');

// ====================================
// Public Routes (no auth required)
// ====================================

/**
 * @route   POST /api/auth/register/init
 * @desc    Initiate registration - validate email/password and send verification code
 * @access  Public
 */
router.post('/register/init', initiateRegistration);

/**
 * @route   POST /api/auth/register/verify
 * @desc    Verify 6-digit code and create user account
 * @access  Public
 */
router.post('/register/verify', verifyRegistration);

/**
 * @route   POST /api/auth/register/resend
 * @desc    Resend verification code
 * @access  Public
 */
router.post('/register/resend', resendVerificationCode);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refreshAccessToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate refresh token
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token from email
 * @access  Public
 */
router.post('/reset-password', resetPassword);

// ====================================
// Google OAuth Routes
// ====================================

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback - handles redirect from Google
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  googleCallback
);

// ====================================
// Protected Routes (auth required)
// ====================================

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (firstName, lastName)
 * @access  Private
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.put('/password', authenticateToken, changePassword);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticateToken, verifyUserExists, deleteAccount);

// ====================================
// Set Password Routes (for Google-only users)
// ====================================

/**
 * @route   POST /api/auth/set-password/init
 * @desc    Initiate password setup - sends verification code
 * @access  Private
 */
router.post('/set-password/init', authenticateToken, initiateSetPassword);

/**
 * @route   POST /api/auth/set-password/verify
 * @desc    Verify code and set password
 * @access  Private
 */
router.post('/set-password/verify', authenticateToken, verifySetPassword);

/**
 * @route   POST /api/auth/set-password/resend
 * @desc    Resend verification code for password setup
 * @access  Private
 */
router.post('/set-password/resend', authenticateToken, resendSetPasswordCode);

// ====================================
// Link Google Account Routes (for email/password users)
// ====================================

/**
 * @route   POST /api/auth/link-google/init
 * @desc    Generate link token for Google OAuth linking
 * @access  Private
 */
router.post('/link-google/init', authenticateToken, initiateLinkGoogle);

/**
 * @route   GET /api/auth/link-google
 * @desc    Initiate Google OAuth flow for account linking
 * @access  Public (with linkToken query param)
 */
router.get(
  '/link-google',
  (req, res, next) => {
    // Store linkToken in session state to pass through OAuth flow
    const { linkToken } = req.query;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: linkToken || '',
    })(req, res, next);
  }
);

module.exports = router;
