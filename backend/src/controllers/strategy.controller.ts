import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';

export const getStrategies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { trades: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: strategies
    });
  } catch (error) {
    next(error);
  }
};

export const getStrategy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const strategy = await prisma.strategy.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Strategy not found',
          statusCode: 404
        }
      });
      return;
    }

    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
};

export const createStrategy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Check if strategy with same name already exists for user
    const existingStrategy = await prisma.strategy.findFirst({
      where: {
        name,
        userId: req.userId
      }
    });

    if (existingStrategy) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Strategy with this name already exists',
          statusCode: 400
        }
      });
      return;
    }

    const strategy = await prisma.strategy.create({
      data: {
        name,
        description,
        userId: req.userId!
      }
    });

    res.status(201).json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
};

export const updateStrategy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description } = req.body;

    // Check if strategy exists and belongs to user
    const existingStrategy = await prisma.strategy.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!existingStrategy) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Strategy not found',
          statusCode: 404
        }
      });
      return;
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingStrategy.name) {
      const duplicateStrategy = await prisma.strategy.findFirst({
        where: {
          name,
          userId: req.userId,
          id: { not: req.params.id }
        }
      });

      if (duplicateStrategy) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Strategy with this name already exists',
            statusCode: 400
          }
        });
      }
    }

    const strategy = await prisma.strategy.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description })
      }
    });

    res.json({
      success: true,
      data: strategy
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStrategy = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if strategy exists and belongs to user
    const strategy = await prisma.strategy.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });

    if (!strategy) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Strategy not found',
          statusCode: 404
        }
      });
      return;
    }

    // Warn if strategy has trades
    if (strategy._count.trades > 0) {
      res.status(400).json({
        success: false,
        error: {
          message: `Cannot delete strategy with ${strategy._count.trades} associated trades. Please reassign or delete the trades first.`,
          statusCode: 400
        }
      });
      return;
    }

    await prisma.strategy.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};