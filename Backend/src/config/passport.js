const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/auth');

const prisma = new PrismaClient();

// Admin emails for auto-granting admin role (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'anshaal1mill@gmail.com')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(email => email);

const isAdminEmail = (email) => ADMIN_EMAILS.includes(email.toLowerCase());

/**
 * Configure Passport.js strategies
 */
const configurePassport = () => {
  // ====================================
  // Local Strategy (Email/Password)
  // ====================================
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Check if user has password (might be OAuth-only user)
          if (!user.passwordHash) {
            return done(null, false, { 
              message: 'This account uses Google sign-in. Please sign in with Google.' 
            });
          }

          // Check if email is verified
          if (!user.emailVerified) {
            return done(null, false, { message: 'Please verify your email before logging in' });
          }

          // Verify password
          const isValidPassword = await comparePassword(password, user.passwordHash);
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return done(null, user);
        } catch (error) {
          console.error('Local strategy error:', error);
          return done(error);
        }
      }
    )
  );

  // ====================================
  // Google OAuth 2.0 Strategy
  // ====================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
          scope: ['profile', 'email'],
          passReqToCallback: true, // Pass request to callback for linkToken access
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            const googleId = profile.id;
            const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
            const lastName = profile.name?.familyName || '';

            // Check for link token in query state (for account linking flow)
            const linkToken = req.query?.state || '';

            if (!email) {
              return done(null, false, { message: 'No email provided by Google' });
            }

            // Check if user exists with this Google ID
            let user = await prisma.user.findUnique({
              where: { googleId },
            });

            if (user) {
              // Existing Google user - update last login
              user = await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
              });
              return done(null, user);
            }

            // Check if user exists with same email
            user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) {
              // User exists with this email - link Google account
              // This handles both:
              // 1. User signed up with email/password, now signing in with Google
              // 2. User explicitly linking their Google account from profile page
              
              // If there's a link token, verify it matches this user
              if (linkToken) {
                const validLinkCode = await prisma.verificationCode.findFirst({
                  where: {
                    email: user.email,
                    code: linkToken,
                    type: 'LINK_GOOGLE',
                    used: false,
                  },
                });

                if (!validLinkCode || new Date() > validLinkCode.expiresAt) {
                  return done(null, false, { message: 'Invalid or expired link token' });
                }

                // Mark the link code as used
                await prisma.verificationCode.update({
                  where: { id: validLinkCode.id },
                  data: { used: true },
                });
              }

              // Link Google account to existing user
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId,
                  emailVerified: true, // Auto-verify for Google users
                  lastLogin: new Date(),
                  // Only update name if not already set
                  firstName: user.firstName || firstName,
                  lastName: user.lastName || lastName,
                },
              });
              
              console.log(`Google account linked to existing user: ${email}`);
              return done(null, user);
            }

            // Create new user
            const isAdmin = isAdminEmail(email);
            user = await prisma.user.create({
              data: {
                email,
                googleId,
                firstName,
                lastName,
                emailVerified: true, // Auto-verify for Google users
                role: isAdmin ? 'ADMIN' : 'USER',
                lastLogin: new Date(),
              },
            });

            console.log(`New user created via Google OAuth: ${email} (Admin: ${isAdmin})`);
            return done(null, user);
          } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn('Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  // ====================================
  // Serialization (for sessions - optional)
  // ====================================
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { configurePassport, passport };
