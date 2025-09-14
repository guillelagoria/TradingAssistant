import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { marketService } from '../services/market.service';
import { ApiResponse } from '../types';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errors.array()
      }
    });
    return;
  }

  next();
};

// Alias for consistency with other parts of the codebase
export const validateRequest = handleValidationErrors;

/**
 * Middleware to validate trade data against market specifications
 */
export const validateTradeData = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { market, entryPrice, quantity, stopLoss, takeProfit } = req.body;

  // If no market specified, use default
  const marketSymbol = market || 'ES';

  try {
    // Validate that market exists
    const marketSpec = marketService.getMarket(marketSymbol);
    if (!marketSpec) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Invalid market: ${marketSymbol}`,
          statusCode: 400
        }
      };

      res.status(400).json(response);
      return;
    }

    // Validate trade parameters against market specs
    const validation = marketService.validateTrade(
      parseFloat(entryPrice),
      parseInt(quantity),
      marketSymbol,
      stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit ? parseFloat(takeProfit) : undefined
    );

    if (!validation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Trade validation failed',
          statusCode: 400,
          details: validation.errors
        }
      };

      res.status(400).json(response);
      return;
    }

    // Add warnings to request if any
    if (validation.warnings && validation.warnings.length > 0) {
      (req as any).marketWarnings = validation.warnings;
    }

    // Add market specification to request for use in controllers
    (req as any).marketSpec = marketSpec;

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Market validation failed',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
    return;
  }
};

/**
 * Middleware to validate price alignment to market tick size
 */
export const validatePriceTicks = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { market, entryPrice, stopLoss, takeProfit } = req.body;
  const marketSymbol = market || 'ES';

  try {
    const marketSpec = marketService.getMarket(marketSymbol);
    if (!marketSpec) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: `Invalid market: ${marketSymbol}`,
          statusCode: 400
        }
      };

      res.status(400).json(response);
      return;
    }

    const errors: string[] = [];

    // Check entry price
    if (entryPrice) {
      const roundedEntry = marketService.roundToValidTick(parseFloat(entryPrice), marketSpec);
      if (Math.abs(parseFloat(entryPrice) - roundedEntry) > 0.001) {
        errors.push(`Entry price ${entryPrice} should be ${roundedEntry} (aligned to tick size ${marketSpec.tickSize})`);
      }
    }

    // Check stop loss
    if (stopLoss) {
      const roundedStop = marketService.roundToValidTick(parseFloat(stopLoss), marketSpec);
      if (Math.abs(parseFloat(stopLoss) - roundedStop) > 0.001) {
        errors.push(`Stop loss ${stopLoss} should be ${roundedStop} (aligned to tick size ${marketSpec.tickSize})`);
      }
    }

    // Check take profit
    if (takeProfit) {
      const roundedTakeProfit = marketService.roundToValidTick(parseFloat(takeProfit), marketSpec);
      if (Math.abs(parseFloat(takeProfit) - roundedTakeProfit) > 0.001) {
        errors.push(`Take profit ${takeProfit} should be ${roundedTakeProfit} (aligned to tick size ${marketSpec.tickSize})`);
      }
    }

    if (errors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Price tick validation failed',
          statusCode: 400,
          details: errors
        }
      };

      res.status(400).json(response);
      return;
    }

    next();
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: {
        message: 'Price tick validation failed',
        statusCode: 500,
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    };

    res.status(500).json(response);
    return;
  }
};