/**
 * Email Service
 *
 * Currently using console logging for development.
 * TODO: Integrate with email provider (Resend, SendGrid, etc.)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export class EmailService {
  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<void> {
    const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    // TODO: Replace with actual email service
    console.log('\n========== EMAIL VERIFICATION ==========');
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`Subject: Verify your Trading Diary account`);
    console.log(`\nHi ${name || 'there'},\n`);
    console.log('Thank you for registering with Trading Diary!');
    console.log('Please verify your email address by clicking the link below:\n');
    console.log(verificationUrl);
    console.log('\nThis link will expire in 24 hours.');
    console.log('\nIf you did not create an account, please ignore this email.');
    console.log('========================================\n');

    // Log for security audit
    console.log(`[SECURITY] Email verification sent to ${email}`);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, name?: string): Promise<void> {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    // TODO: Replace with actual email service
    console.log('\n========== PASSWORD RESET ==========');
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`Subject: Reset your Trading Diary password`);
    console.log(`\nHi ${name || 'there'},\n`);
    console.log('We received a request to reset your password.');
    console.log('Click the link below to create a new password:\n');
    console.log(resetUrl);
    console.log('\nThis link will expire in 1 hour.');
    console.log('\nIf you did not request a password reset, please ignore this email.');
    console.log('Your password will remain unchanged.');
    console.log('====================================\n');

    // Log for security audit
    console.log(`[SECURITY] Password reset email sent to ${email}`);
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    // TODO: Replace with actual email service
    console.log('\n========== WELCOME EMAIL ==========');
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`Subject: Welcome to Trading Diary!`);
    console.log(`\nHi ${name || 'there'},\n`);
    console.log('Welcome to Trading Diary!');
    console.log('Your email has been verified successfully.');
    console.log('\nYou can now start tracking your trades and improving your trading performance.');
    console.log('\nBest regards,');
    console.log('The Trading Diary Team');
    console.log('===================================\n');
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(email: string, name?: string): Promise<void> {
    // TODO: Replace with actual email service
    console.log('\n========== PASSWORD CHANGED ==========');
    console.log(`To: ${email}`);
    console.log(`Name: ${name || 'User'}`);
    console.log(`Subject: Your password has been changed`);
    console.log(`\nHi ${name || 'there'},\n`);
    console.log('Your password has been changed successfully.');
    console.log('\nIf you did not make this change, please contact support immediately.');
    console.log('\nBest regards,');
    console.log('The Trading Diary Team');
    console.log('======================================\n');

    // Log for security audit
    console.log(`[SECURITY] Password changed notification sent to ${email}`);
  }
}

export const emailService = new EmailService();
