const { Resend } = require('resend');

// Initialize Resend with API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Email sender configuration
// IMPORTANT: For production, FROM_EMAIL must use a verified domain (not @resend.dev)
// Example: 'TradeGuardAI <noreply@yourdomain.com>'
const FROM_EMAIL = process.env.FROM_EMAIL || 'TradeGuardAI <onboarding@resend.dev>';
const APP_NAME = 'TradeGuardAI';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Check if properly configured for production
const IS_DEV_MODE = !RESEND_API_KEY || FROM_EMAIL.includes('@resend.dev');

// Log configuration status on startup
if (!resend) {
  console.warn('⚠️  RESEND_API_KEY not set - emails will be logged to console only (dev mode)');
} else if (FROM_EMAIL.includes('@resend.dev')) {
  console.warn('⚠️  Using @resend.dev domain - emails will only work for verified recipients');
  console.warn('   For production, verify your domain at https://resend.com/domains');
} else {
  console.log('✅ Email service configured with verified domain');
}

/**
 * Helper function to log email to console (for dev mode)
 */
const logEmailToConsole = (email, subject, code, purpose = 'verification') => {
  console.log('\n📧 EMAIL (Development Mode)');
  console.log('━'.repeat(60));
  console.log(`To: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`\n🔑 VERIFICATION CODE: ${code}`);
  console.log(`⏰ Expires in: 10 minutes`);
  console.log('━'.repeat(60) + '\n');
};

/**
 * Send verification code email for registration or password setup
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} firstName - User's first name (optional)
 * @param {string} purpose - Purpose of the verification (optional, e.g., 'set your password')
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const sendVerificationCode = async (email, code, firstName = '', purpose = 'complete your registration') => {
  try {
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
    const subjectText = purpose === 'set your password' ? 'Set your password' : 'Verify your account';
    const headingText = purpose === 'set your password' ? 'Set Your Password' : 'Verify Your Email';
    const bodyText = purpose === 'set your password' 
      ? 'Enter this verification code to set your password:'
      : 'Enter this verification code to complete your registration:';
    
    // If Resend is not configured, log to console (dev mode only)
    if (!resend) {
      console.warn('⚠️  Email service not configured - logging email to console');
      logEmailToConsole(email, `${APP_NAME} - ${subjectText}`, code, purpose);
      return { success: true, devMode: true };
    }
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${APP_NAME} - ${subjectText}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafbfc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e5e5e7; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1e65fa; padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #323539; font-size: 20px; font-weight: 600;">${headingText}</h2>
                      <p style="margin: 0 0 24px 0; color: #858c95; font-size: 15px; line-height: 1.5;">${greeting}</p>
                      <p style="margin: 0 0 32px 0; color: #323539; font-size: 15px; line-height: 1.5;">${bodyText}</p>
                      <!-- Code Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #fafbfc; border: 2px solid #e5e5e7; border-radius: 8px; padding: 24px; text-align: center;">
                            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1e65fa;">${code}</span>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0 0 0; color: #858c95; font-size: 13px; line-height: 1.5;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafbfc; border-top: 1px solid #e5e5e7;">
                      <p style="margin: 0; color: #858c95; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Verification email sent:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} firstName - User's first name (optional)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const sendPasswordResetEmail = async (email, resetToken, firstName = '') => {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

    // Helper to log reset email to console
    const logResetEmail = () => {
      console.log('\n📧 EMAIL (Development Mode)');
      console.log('━'.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Subject: Reset your ${APP_NAME} password`);
      console.log(`Greeting: ${greeting}`);
      console.log(`\n🔗 PASSWORD RESET LINK:`);
      console.log(resetUrl);
      console.log(`⏰ Expires in: 1 hour`);
      console.log('━'.repeat(60) + '\n');
    };

    // If Resend is not configured, log to console (dev mode only)
    if (!resend) {
      console.warn('⚠️  Email service not configured - logging email to console');
      logResetEmail();
      return { success: true, devMode: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reset your ${APP_NAME} password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafbfc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e5e5e7; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1e65fa; padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #323539; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                      <p style="margin: 0 0 24px 0; color: #858c95; font-size: 15px; line-height: 1.5;">${greeting}</p>
                      <p style="margin: 0 0 32px 0; color: #323539; font-size: 15px; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new password:</p>
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 24px;">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #1e65fa; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 8px 0; color: #858c95; font-size: 13px; line-height: 1.5;">Or copy this link:</p>
                      <p style="margin: 0 0 24px 0; color: #1e65fa; font-size: 12px; word-break: break-all;">${resetUrl}</p>
                      <p style="margin: 0; color: #858c95; font-size: 13px; line-height: 1.5;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafbfc; border-top: 1px solid #e5e5e7;">
                      <p style="margin: 0; color: #858c95; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Password reset email sent:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
const sendWelcomeEmail = async (email, firstName = '') => {
  try {
    const greeting = firstName ? `Welcome, ${firstName}!` : 'Welcome!';
    const dashboardUrl = `${FRONTEND_URL}/app`;

    // Helper to log welcome email to console
    const logWelcomeEmail = () => {
      console.log('\n📧 EMAIL (Development Mode)');
      console.log('━'.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Subject: Welcome to ${APP_NAME}!`);
      console.log(`Greeting: ${greeting}`);
      console.log(`\n🎉 Welcome message sent!`);
      console.log(`Dashboard: ${dashboardUrl}`);
      console.log('━'.repeat(60) + '\n');
    };

    // If Resend is not configured, log to console (dev mode only)
    if (!resend) {
      console.warn('⚠️  Email service not configured - logging email to console');
      logWelcomeEmail();
      return { success: true, devMode: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${APP_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafbfc; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e5e5e7; border-radius: 12px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #1e65fa; padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${APP_NAME}</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h2 style="margin: 0 0 16px 0; color: #323539; font-size: 20px; font-weight: 600;">${greeting}</h2>
                      <p style="margin: 0 0 32px 0; color: #323539; font-size: 15px; line-height: 1.5;">Your account has been successfully created. Start exploring cryptocurrency trading with AI-powered insights!</p>
                      <!-- Features Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="background-color: #fafbfc; border: 1px solid #e5e5e7; border-radius: 8px; padding: 24px;">
                            <p style="margin: 0 0 16px 0; color: #323539; font-size: 14px; font-weight: 600;">Get Started:</p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr><td style="padding: 6px 0; color: #858c95; font-size: 14px;">• Track real-time crypto prices</td></tr>
                              <tr><td style="padding: 6px 0; color: #858c95; font-size: 14px;">• AI-powered predictions</td></tr>
                              <tr><td style="padding: 6px 0; color: #858c95; font-size: 14px;">• Analyze market trends</td></tr>
                              <tr><td style="padding: 6px 0; color: #858c95; font-size: 14px;">• Learn with our resources</td></tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-top: 32px;">
                            <a href="${dashboardUrl}" style="display: inline-block; background-color: #1e65fa; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Go to Dashboard</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafbfc; border-top: 1px solid #e5e5e7;">
                      <p style="margin: 0; color: #858c95; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Welcome email sent:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationCode,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
