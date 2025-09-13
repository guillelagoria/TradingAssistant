import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'No token provided',
          statusCode: 401
        }
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        commission: true,
        timezone: true
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

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid token',
        statusCode: 401
      }
    });
  }
};