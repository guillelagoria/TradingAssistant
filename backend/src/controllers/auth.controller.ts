import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { email, password, name } = req.body;

    const result = await authService.register({ email, password, name });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 409
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 401
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 * Note: Since we're using JWT, logout is handled client-side by removing the token
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Log logout event
    if (req.user) {
      console.log(`[AUTH] User logged out: ${req.user.email} (ID: ${req.user.id})`);
    }

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { token } = req.body;

    const user = await authService.verifyEmail(token);

    res.json({
      success: true,
      data: {
        user,
        message: 'Email verified successfully! You can now log in.'
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Request password reset
 * POST /api/auth/request-password-reset
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Change password for logged-in user
 * POST /api/auth/change-password
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!req.userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401
        }
      });
      return;
    }

    const result = await authService.changePassword(req.userId, currentPassword, newPassword);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 401
        }
      });
      return;
    }
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
export const me = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          errors: errors.array()
        }
      });
      return;
    }

    const { email } = req.body;

    const result = await authService.resendVerificationEmail(email);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400
        }
      });
      return;
    }
    next(error);
  }
};