import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { jwtConfig, JWTPayload } from '../config/jwt.config';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

/**
 * Middleware to authenticate requests using JWT tokens
 * Requires valid token in Authorization header
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'No token provided. Please include Authorization header with Bearer token.',
          statusCode: 401
        }
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true,
        emailVerified: true,
        isActive: true,
        subscriptionTier: true,
        activeAccountId: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 401
        }
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Account has been deactivated. Please contact support.',
          statusCode: 403
        }
      });
      return;
    }

    // Attach user to request
    req.userId = user.id;
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Token has expired. Please refresh your token or log in again.',
          statusCode: 401,
          code: 'TOKEN_EXPIRED'
        }
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401,
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        statusCode: 401
      }
    });
  }
};

/**
 * Middleware for optional authentication
 * Attaches user to request if valid token is provided, but doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret) as JWTPayload;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true,
        emailVerified: true,
        isActive: true
      }
    });

    if (user && user.isActive) {
      req.userId = user.id;
      req.user = user;
    }

    next();
  } catch (error) {
    // Token is invalid, but continue without authentication
    next();
  }
};

/**
 * Middleware to ensure user's email is verified
 * Must be used after authenticate middleware
 */
export const requireEmailVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        statusCode: 401
      }
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Email verification required. Please verify your email to access this resource.',
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED'
      }
    });
    return;
  }

  next();
};