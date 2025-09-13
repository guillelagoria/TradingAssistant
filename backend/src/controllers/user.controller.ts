import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            trades: true,
            strategies: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 404
        }
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { commission, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(commission !== undefined && { commission }),
        ...(timezone !== undefined && { timezone })
      },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 404
        }
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
          statusCode: 401
        }
      });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Delete user and all related data (cascading delete)
    await prisma.user.delete({
      where: { id: req.userId }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};