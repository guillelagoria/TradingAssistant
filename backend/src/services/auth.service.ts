import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../server';
import { jwtConfig, JWTPayload } from '../config/jwt.config';
import { emailService } from './email.service';

const SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData) {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken, user.name || undefined);

    // Generate tokens for auto-login
    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name || undefined
    });

    // Log registration event
    console.log(`[AUTH] User registered: ${user.email} (ID: ${user.id})`);

    return {
      user,
      ...tokens,
      message: 'Registration successful! Please check your email to verify your account.'
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('Account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified (disabled for development)
    // if (!user.emailVerified) {
    //   throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    // }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = this.generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name || undefined
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    // Log login event
    console.log(`[AUTH] User logged in: ${user.email} (ID: ${user.id})`);

    return {
      user: userWithoutPassword,
      ...tokens
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Check if token has expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new Error('Verification token has expired. Please request a new verification email.');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true
      }
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(updatedUser.email, updatedUser.name || undefined);

    // Log verification event
    console.log(`[AUTH] Email verified: ${updatedUser.email} (ID: ${updatedUser.id})`);

    return updatedUser;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[SECURITY] Password reset requested for non-existent email: ${email}`);
      return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken, user.name || undefined);

    // Log reset request
    console.log(`[SECURITY] Password reset requested: ${user.email} (ID: ${user.id})`);

    return { message: 'If an account exists with this email, you will receive a password reset link.' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token has expired
    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new Error('Reset token has expired. Please request a new password reset.');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name || undefined);

    // Log password change
    console.log(`[SECURITY] Password reset completed: ${user.email} (ID: ${user.id})`);

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  /**
   * Change password for logged-in user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Send confirmation email
    await emailService.sendPasswordChangedEmail(user.email, user.name || undefined);

    // Log password change
    console.log(`[SECURITY] Password changed: ${user.email} (ID: ${user.id})`);

    return { message: 'Password has been changed successfully' };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as JWTPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name || undefined
        } as JWTPayload,
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Validate token
   */
  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  private generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(
      payload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      payload,
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account exists with this email, you will receive a verification link.' };
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + EMAIL_VERIFICATION_EXPIRY_HOURS);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken, user.name || undefined);

    console.log(`[AUTH] Verification email resent: ${user.email} (ID: ${user.id})`);

    return { message: 'If an account exists with this email, you will receive a verification link.' };
  }
}

export const authService = new AuthService();
