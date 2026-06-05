const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateVerificationCode,
  generateResetToken,
  getCodeExpiry,
  getResetTokenExpiry,
  getRefreshTokenExpiry,
  isValidEmail,
  validatePassword,
} = require('../utils/auth');
const {
  sendVerificationCode,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} = require('../services/emailService');

const prisma = new PrismaClient();

// Admin emails for auto-granting admin role (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'anshaal1mill@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email);

const isAdminEmail = (email) => ADMIN_EMAILS.includes(email.toLowerCase());
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Initiate registration - validate and send verification code
 * POST /api/auth/register/init
 */
const initiateRegistration = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
    }

    // Validate email format
    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation error',
        message: passwordValidation.message,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(409).json({
          error: 'User exists',
          message: 'An account with this email already exists',
        });
      }
      // User exists but not verified - allow re-registration
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Rate limit: Check for recent verification codes
    const recentCodes = await prisma.verificationCode.count({
      where: {
        email: normalizedEmail,
        type: 'REGISTRATION',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) }, // Last minute
      },
    });

    if (recentCodes > 0) {
      return res.status(429).json({
        error: 'Rate limit',
        message: 'Please wait 1 minute before requesting another code',
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiry();

    console.log('[INIT DEBUG] Generated code:', code, 'for email:', normalizedEmail);

    // Delete old codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail, type: 'REGISTRATION' },
    });

    // Store verification code with pending user data
    const storedCode = await prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        type: 'REGISTRATION',
        expiresAt,
      },
    });
    
    console.log('[INIT DEBUG] Stored in DB:', { id: storedCode.id, code: storedCode.code, email: storedCode.email });

    // Hash password and store temporarily (we'll need it when verifying)
    const passwordHash = await hashPassword(password);
    
    // Store pending registration data in a simple way - using verification code record
    // We'll pass the hashed password in the verify request (client stores it encrypted)
    // Alternative: Store in session/cache - for simplicity, we require password again

    // Send verification email
    const emailResult = await sendVerificationCode(normalizedEmail, code, firstName);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail,
      // Store hashed password encrypted for client to send back
      // In production, use a more secure approach (Redis session, etc.)
      pendingData: {
        passwordHash,
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
      },
    });
  } catch (error) {
    console.error('Registration initiation error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during registration',
    });
  }
};

/**
 * Verify registration code and create user
 * POST /api/auth/register/verify
 */
const verifyRegistration = async (req, res) => {
  try {
    const { email, code, pendingData } = req.body;

    console.log('[VERIFY DEBUG] Received:', { email, code: code?.substring(0, 2) + '****', hasPendingData: !!pendingData });

    if (!email || !code) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and verification code are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[VERIFY DEBUG] Normalized email:', normalizedEmail);

    // Find verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        type: 'REGISTRATION',
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    console.log('[VERIFY DEBUG] Found code in DB:', verificationCode ? { 
      dbEmail: verificationCode.email,
      dbCode: verificationCode.code?.substring(0, 2) + '****',
      used: verificationCode.used,
      attempts: verificationCode.attempts
    } : 'NOT FOUND');

    if (!verificationCode) {
      return res.status(400).json({
        error: 'Invalid code',
        message: 'No pending verification found. Please request a new code.',
      });
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
      return res.status(400).json({
        error: 'Code expired',
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Check attempts
    if (verificationCode.attempts >= 5) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    // Verify code
    const normalizedCode = code?.toString().trim();
    const dbCode = verificationCode.code?.toString().trim();
    
    console.log('[VERIFY DEBUG] Comparing codes:', {
      userCode: normalizedCode,
      dbCode: dbCode,
      userCodeLength: normalizedCode?.length,
      dbCodeLength: dbCode?.length,
      match: dbCode === normalizedCode,
    });
    
    if (dbCode !== normalizedCode) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Incorrect verification code',
        attemptsRemaining: 5 - verificationCode.attempts - 1,
      });
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Check if user already exists (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User exists',
        message: 'An account with this email already exists. Please log in instead.',
      });
    }

    // Create user
    const isAdmin = isAdminEmail(normalizedEmail);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: pendingData?.passwordHash,
        firstName: pendingData?.firstName || '',
        lastName: pendingData?.lastName || '',
        emailVerified: true,
        role: isAdmin ? 'ADMIN' : 'USER',
        lastLogin: new Date(),
        // Don't set googleId - leave it undefined for email-registered users
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.firstName).catch(console.error);

    // Clean up old verification codes
    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail, type: 'REGISTRATION' },
    });

    console.log(`New user registered: ${user.email} (Admin: ${isAdmin})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        googleId: user.googleId,
        hasPassword: !!user.passwordHash,
        hasGoogleLinked: !!user.googleId,
        subscription: {
          planTier: 'FREE',
          status: 'ACTIVE',
        },
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during verification',
    });
  }
};

/**
 * Resend verification code
 * POST /api/auth/register/resend
 */
const resendVerificationCode = async (req, res) => {
  try {
    const { email, pendingData } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit
    const recentCodes = await prisma.verificationCode.count({
      where: {
        email: normalizedEmail,
        type: 'REGISTRATION',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCodes > 0) {
      return res.status(429).json({
        error: 'Rate limit',
        message: 'Please wait 1 minute before requesting another code',
      });
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiry();

    // Delete old codes
    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail, type: 'REGISTRATION' },
    });

    // Create new code
    await prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        type: 'REGISTRATION',
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendVerificationCode(normalizedEmail, code, pendingData?.firstName);
    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'New verification code sent',
    });
  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while resending code',
    });
  }
};

/**
 * Login with email and password
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with subscription
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Check if user has password
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'This account uses Google sign-in. Please sign in with Google.',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        error: 'Email not verified',
        message: 'Please verify your email before logging in',
        needsVerification: true,
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Format subscription for response
    const subscription = user.subscription
      ? {
          planTier: user.subscription.planTier,
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : {
          planTier: 'FREE',
          status: 'ACTIVE',
        };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        googleId: user.googleId,
        hasPassword: !!user.passwordHash,
        hasGoogleLinked: !!user.googleId,
        subscription,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login',
    });
  }
};

/**
 * Handle Google OAuth callback
 * GET /api/auth/google/callback
 */
const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Refresh token is invalid or expired',
      });
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Refresh token not found or expired',
      });
    }

    const user = storedToken.user;

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while refreshing token',
    });
  }
};

/**
 * Logout - invalidate refresh token
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during logout',
    });
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        googleId: true,
        passwordHash: true, // Need to check if password exists
        createdAt: true,
        lastLogin: true,
        subscription: {
          select: {
            planTier: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Don't expose passwordHash, just indicate if user has password set
    const { passwordHash, subscription, ...userWithoutPassword } = user;

    // Default subscription for users without one
    const subscriptionData = subscription || {
      planTier: 'FREE',
      status: 'ACTIVE',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    res.status(200).json({
      success: true,
      user: {
        ...userWithoutPassword,
        hasPassword: !!passwordHash,
        hasGoogleLinked: !!user.googleId,
        subscription: subscriptionData,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching user data',
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit
    const recentCodes = await prisma.verificationCode.count({
      where: {
        email: normalizedEmail,
        type: 'PASSWORD_RESET',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCodes > 0) {
      // Don't reveal rate limit to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const expiresAt = getResetTokenExpiry();

    // Delete old reset codes
    await prisma.verificationCode.deleteMany({
      where: { email: normalizedEmail, type: 'PASSWORD_RESET' },
    });

    // Store reset token
    await prisma.verificationCode.create({
      data: {
        email: normalizedEmail,
        code: resetToken,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, resetToken, user.firstName);
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while processing your request',
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, token, password } = req.body;

    if (!email || !token || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, token, and new password are required',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation error',
        message: passwordValidation.message,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find reset token
    const resetCode = await prisma.verificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code: token,
        type: 'PASSWORD_RESET',
        used: false,
      },
    });

    if (!resetCode) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset link is invalid or has already been used',
      });
    }

    // Check expiry
    if (new Date() > resetCode.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: resetCode.id } });
      return res.status(400).json({
        error: 'Token expired',
        message: 'Password reset link has expired. Please request a new one.',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'No account found with this email',
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true, // Also verify email if not already
      },
    });

    // Mark token as used
    await prisma.verificationCode.update({
      where: { id: resetCode.id },
      data: { used: true },
    });

    // Invalidate all refresh tokens (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while resetting password',
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.userId;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No fields to update',
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while updating profile',
    });
  }
};

/**
 * Change password (for logged-in users)
 * PUT /api/auth/password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Current password and new password are required',
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation error',
        message: passwordValidation.message,
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Check if user has password (might be OAuth-only)
    if (!user.passwordHash) {
      return res.status(400).json({
        error: 'No password set',
        message: 'Your account uses Google sign-in. You can set a password by using the forgot password feature.',
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid password',
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while changing password',
    });
  }
};

/**
 * Delete user account
 * DELETE /api/auth/account
 */
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // If user has password, require it for deletion
    if (user.passwordHash) {
      if (!password) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Password is required to delete account',
        });
      }

      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Password is incorrect',
        });
      }
    }

    // Delete user (cascades to related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`User account deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while deleting account',
    });
  }
};

/**
 * Initiate password setup for Google-only users
 * POST /api/auth/set-password/init
 */
const initiateSetPassword = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Check if user already has a password
    if (user.passwordHash) {
      return res.status(400).json({
        error: 'Password exists',
        message: 'You already have a password set. Use the change password feature instead.',
      });
    }

    // Rate limit: Check for recent verification codes
    const recentCodes = await prisma.verificationCode.count({
      where: {
        email: user.email,
        type: 'SET_PASSWORD',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCodes > 0) {
      return res.status(429).json({
        error: 'Rate limit',
        message: 'Please wait 1 minute before requesting another code',
      });
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiry();

    // Delete old codes for this email
    await prisma.verificationCode.deleteMany({
      where: { email: user.email, type: 'SET_PASSWORD' },
    });

    // Store verification code
    await prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        type: 'SET_PASSWORD',
        expiresAt,
      },
    });

    // Send verification email
    const emailResult = await sendVerificationCode(user.email, code, user.firstName, 'set your password');
    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Initiate set password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while initiating password setup',
    });
  }
};

/**
 * Verify code and set password for Google-only users
 * POST /api/auth/set-password/verify
 */
const verifySetPassword = async (req, res) => {
  try {
    const { code, password } = req.body;
    const userId = req.user.userId;

    if (!code || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Verification code and password are required',
      });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Validation error',
        message: passwordValidation.message,
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Check if user already has a password
    if (user.passwordHash) {
      return res.status(400).json({
        error: 'Password exists',
        message: 'You already have a password set.',
      });
    }

    // Find verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email: user.email,
        type: 'SET_PASSWORD',
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      return res.status(400).json({
        error: 'Invalid code',
        message: 'No pending verification found. Please request a new code.',
      });
    }

    // Check if code is expired
    if (new Date() > verificationCode.expiresAt) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
      return res.status(400).json({
        error: 'Code expired',
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Check attempts
    if (verificationCode.attempts >= 5) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } });
      return res.status(429).json({
        error: 'Too many attempts',
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    // Verify code
    if (verificationCode.code !== code) {
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Incorrect verification code',
        attemptsRemaining: 5 - verificationCode.attempts - 1,
      });
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { used: true },
    });

    // Hash password and update user
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Clean up verification codes
    await prisma.verificationCode.deleteMany({
      where: { email: user.email, type: 'SET_PASSWORD' },
    });

    res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now log in with email and password.',
    });
  } catch (error) {
    console.error('Verify set password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while setting password',
    });
  }
};

/**
 * Resend verification code for password setup
 * POST /api/auth/set-password/resend
 */
const resendSetPasswordCode = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Rate limit
    const recentCodes = await prisma.verificationCode.count({
      where: {
        email: user.email,
        type: 'SET_PASSWORD',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentCodes > 0) {
      return res.status(429).json({
        error: 'Rate limit',
        message: 'Please wait 1 minute before requesting another code',
      });
    }

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = getCodeExpiry();

    // Delete old codes
    await prisma.verificationCode.deleteMany({
      where: { email: user.email, type: 'SET_PASSWORD' },
    });

    // Create new code
    await prisma.verificationCode.create({
      data: {
        email: user.email,
        code,
        type: 'SET_PASSWORD',
        expiresAt,
      },
    });

    // Send email
    const emailResult = await sendVerificationCode(user.email, code, user.firstName, 'set your password');
    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'New verification code sent',
    });
  } catch (error) {
    console.error('Resend set password code error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while resending code',
    });
  }
};

/**
 * Generate link token for Google OAuth account linking
 * POST /api/auth/link-google/init
 */
const initiateLinkGoogle = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found',
      });
    }

    // Check if user already has Google linked
    if (user.googleId) {
      return res.status(400).json({
        error: 'Already linked',
        message: 'Your Google account is already connected.',
      });
    }

    // Create a linking token to pass to OAuth flow
    const linkToken = generateResetToken(); // Reuse the random token generator
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete old linking codes
    await prisma.verificationCode.deleteMany({
      where: { email: user.email, type: 'LINK_GOOGLE' },
    });

    // Store linking token
    await prisma.verificationCode.create({
      data: {
        email: user.email,
        code: linkToken,
        type: 'LINK_GOOGLE',
        expiresAt,
      },
    });

    res.status(200).json({
      success: true,
      linkToken,
      message: 'Link token generated. Proceed with Google OAuth.',
    });
  } catch (error) {
    console.error('Initiate link Google error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while initiating Google linking',
    });
  }
};

module.exports = {
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
};
