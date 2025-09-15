/**
 * Break-Even Calculations Service
 * Specific calculations and validations for BE Analysis fields
 */

import { TradeDirection, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TradeWithBEData {
  id?: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  maxFavorablePrice?: number | null;
  maxAdversePrice?: number | null;
  maxPotentialProfit?: number | null;
  maxDrawdown?: number | null;
  breakEvenWorked?: boolean | null;
  quantity: number;
}

interface StopLossOptimization {
  currentStopLoss: number | null;
  suggestedStopLoss: number;
  riskReduction: number;
  profitProtection: number;
  confidence: number;
  reason: string;
}

interface TakeProfitOptimization {
  currentTakeProfit: number | null;
  suggestedTakeProfit: number;
  additionalProfit: number;
  captureImprovement: number;
  confidence: number;
  reason: string;
}

interface BEEfficiencyMetrics {
  beSuccessRate: number;
  avgProtectedAmount: number;
  avgMissedOpportunity: number;
  netBEImpact: number;
  optimalBELevel: number;
  recommendedAction: 'increase_be_usage' | 'decrease_be_usage' | 'optimize_timing' | 'maintain_current';
}

export class BECalculationsService {

  /**
   * Validate BE fields for business logic consistency
   */
  static validateBEFields(trade: TradeWithBEData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { direction, entryPrice, maxPotentialProfit, maxDrawdown, takeProfit, stopLoss } = trade;

    const isLong = direction === 'LONG';

    // Validate maxPotentialProfit
    if (maxPotentialProfit !== null && maxPotentialProfit !== undefined) {
      if (isLong && maxPotentialProfit <= entryPrice) {
        errors.push('maxPotentialProfit must be higher than entryPrice for LONG trades');
      } else if (!isLong && maxPotentialProfit >= entryPrice) {
        errors.push('maxPotentialProfit must be lower than entryPrice for SHORT trades');
      }

      // Warning if maxPotentialProfit is worse than takeProfit
      if (takeProfit) {
        if (isLong && maxPotentialProfit < takeProfit) {
          warnings.push('maxPotentialProfit is less favorable than takeProfit - check data accuracy');
        } else if (!isLong && maxPotentialProfit > takeProfit) {
          warnings.push('maxPotentialProfit is less favorable than takeProfit - check data accuracy');
        }
      }
    }

    // Validate maxDrawdown
    if (maxDrawdown !== null && maxDrawdown !== undefined) {
      if (isLong && maxDrawdown >= entryPrice) {
        errors.push('maxDrawdown must be lower than entryPrice for LONG trades');
      } else if (!isLong && maxDrawdown <= entryPrice) {
        errors.push('maxDrawdown must be higher than entryPrice for SHORT trades');
      }

      // Warning if maxDrawdown is worse than stopLoss
      if (stopLoss) {
        if (isLong && maxDrawdown < stopLoss) {
          warnings.push('maxDrawdown is worse than stopLoss - trade should have been stopped out');
        } else if (!isLong && maxDrawdown > stopLoss) {
          warnings.push('maxDrawdown is worse than stopLoss - trade should have been stopped out');
        }
      }
    }

    // Validate logical consistency
    if (maxPotentialProfit && maxDrawdown) {
      if (isLong && maxPotentialProfit < maxDrawdown) {
        errors.push('maxPotentialProfit cannot be less than maxDrawdown for LONG trades');
      } else if (!isLong && maxPotentialProfit > maxDrawdown) {
        errors.push('maxPotentialProfit cannot be greater than maxDrawdown for SHORT trades');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate stop loss optimization suggestions
   */
  static async calculateStopLossOptimization(userId: string, tradeId?: string): Promise<StopLossOptimization[]> {
    const whereClause: any = { userId, stopLoss: { not: null }, maxDrawdown: { not: null } };
    if (tradeId) {
      whereClause.id = tradeId;
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryDate: 'desc' },
      take: 100 // Analyze recent trades for patterns
    });

    if (trades.length === 0) {
      return [];
    }

    const optimizations: StopLossOptimization[] = [];

    for (const trade of trades) {
      if (!trade.stopLoss || !trade.maxDrawdown) continue;

      const isLong = trade.direction === 'LONG';
      const entryPrice = trade.entryPrice;
      const currentSL = trade.stopLoss;
      const maxDrawdown = trade.maxDrawdown;

      // Calculate how much "room" the trade needed
      const drawdownDistance = Math.abs(entryPrice - maxDrawdown);
      const currentSLDistance = Math.abs(entryPrice - currentSL);

      // Suggest optimal stop loss based on historical drawdown patterns
      let suggestedSL: number;
      let riskReduction = 0;
      let profitProtection = 0;
      let confidence = 50;
      let reason = '';

      // If maxDrawdown was worse than current SL, trade should have been stopped
      const wasStoppedOut = isLong ? maxDrawdown <= currentSL : maxDrawdown >= currentSL;

      if (wasStoppedOut) {
        // Trade was probably stopped out - suggest tighter SL
        const tighterDistance = drawdownDistance * 0.8;
        suggestedSL = isLong ? entryPrice - tighterDistance : entryPrice + tighterDistance;
        riskReduction = ((currentSLDistance - tighterDistance) / currentSLDistance) * 100;
        reason = 'Tighter stop loss would reduce risk while maintaining trade viability';
        confidence = 70;
      } else {
        // Trade survived drawdown - suggest wider SL for more room
        const widerDistance = drawdownDistance * 1.2;
        suggestedSL = isLong ? entryPrice - widerDistance : entryPrice + widerDistance;

        if (widerDistance > currentSLDistance) {
          riskReduction = -((widerDistance - currentSLDistance) / currentSLDistance) * 100;
          reason = 'Wider stop loss would give trade more room to work';
          confidence = 60;
        } else {
          // Current SL is already good
          suggestedSL = currentSL;
          reason = 'Current stop loss level appears optimal';
          confidence = 80;
        }
      }

      // Calculate profit protection (theoretical)
      if (trade.pnl && trade.pnl > 0) {
        const protectedAmount = Math.max(0, trade.pnl * 0.8); // Assume BE would protect 80% of profit
        profitProtection = protectedAmount;
      }

      optimizations.push({
        currentStopLoss: currentSL,
        suggestedStopLoss: suggestedSL,
        riskReduction,
        profitProtection,
        confidence,
        reason
      });
    }

    return optimizations;
  }

  /**
   * Calculate take profit optimization suggestions
   */
  static async calculateTakeProfitOptimization(userId: string, tradeId?: string): Promise<TakeProfitOptimization[]> {
    const whereClause: any = {
      userId,
      takeProfit: { not: null },
      maxPotentialProfit: { not: null },
      exitPrice: { not: null }
    };
    if (tradeId) {
      whereClause.id = tradeId;
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { entryDate: 'desc' },
      take: 100
    });

    const optimizations: TakeProfitOptimization[] = [];

    for (const trade of trades) {
      if (!trade.takeProfit || !trade.maxPotentialProfit || !trade.exitPrice) continue;

      const isLong = trade.direction === 'LONG';
      const entryPrice = trade.entryPrice;
      const currentTP = trade.takeProfit;
      const maxPotential = trade.maxPotentialProfit;

      // Calculate missed opportunity
      const currentTPDistance = Math.abs(currentTP - entryPrice);
      const maxPotentialDistance = Math.abs(maxPotential - entryPrice);

      let suggestedTP: number;
      let additionalProfit = 0;
      let captureImprovement = 0;
      let confidence = 50;
      let reason = '';

      // If max potential was much better than current TP
      if (maxPotentialDistance > currentTPDistance * 1.2) {
        // Suggest more aggressive TP
        const newDistance = currentTPDistance * 1.3;
        suggestedTP = isLong ? entryPrice + newDistance : entryPrice - newDistance;

        const potentialAdditionalProfit = (newDistance - currentTPDistance) * trade.quantity;
        additionalProfit = potentialAdditionalProfit;
        captureImprovement = ((newDistance / maxPotentialDistance) - (currentTPDistance / maxPotentialDistance)) * 100;

        reason = 'More aggressive take profit could capture additional profits';
        confidence = 65;
      } else if (maxPotentialDistance < currentTPDistance * 0.8) {
        // Current TP was too aggressive
        const newDistance = currentTPDistance * 0.9;
        suggestedTP = isLong ? entryPrice + newDistance : entryPrice - newDistance;

        reason = 'More conservative take profit would improve hit rate';
        confidence = 70;
        captureImprovement = 10; // Improved hit rate
      } else {
        // Current TP seems reasonable
        suggestedTP = currentTP;
        reason = 'Current take profit level appears well-positioned';
        confidence = 75;
      }

      optimizations.push({
        currentTakeProfit: currentTP,
        suggestedTakeProfit: suggestedTP,
        additionalProfit,
        captureImprovement,
        confidence,
        reason
      });
    }

    return optimizations;
  }

  /**
   * Calculate Break-Even efficiency metrics
   */
  static async calculateBEEfficiency(userId: string): Promise<BEEfficiencyMetrics> {
    const tradesWithBE = await prisma.trade.findMany({
      where: {
        userId,
        breakEvenWorked: { not: null },
        exitPrice: { not: null }
      },
      orderBy: { entryDate: 'desc' }
    });

    if (tradesWithBE.length === 0) {
      return {
        beSuccessRate: 0,
        avgProtectedAmount: 0,
        avgMissedOpportunity: 0,
        netBEImpact: 0,
        optimalBELevel: 40,
        recommendedAction: 'increase_be_usage'
      };
    }

    const beWorkedTrades = tradesWithBE.filter(t => t.breakEvenWorked === true);
    const beFailedTrades = tradesWithBE.filter(t => t.breakEvenWorked === false);

    const beSuccessRate = (beWorkedTrades.length / tradesWithBE.length) * 100;

    // Calculate average protected amount (successful BE trades)
    let totalProtected = 0;
    let totalMissed = 0;

    for (const trade of beWorkedTrades) {
      if (trade.pnl && trade.pnl > 0) {
        totalProtected += trade.pnl;
      }
    }

    for (const trade of beFailedTrades) {
      if (trade.maxPotentialProfit && trade.exitPrice) {
        const isLong = trade.direction === 'LONG';
        const actualProfit = isLong ?
          (trade.exitPrice - trade.entryPrice) * trade.quantity :
          (trade.entryPrice - trade.exitPrice) * trade.quantity;

        const maxProfit = isLong ?
          (trade.maxPotentialProfit - trade.entryPrice) * trade.quantity :
          (trade.entryPrice - trade.maxPotentialProfit) * trade.quantity;

        if (maxProfit > actualProfit) {
          totalMissed += (maxProfit - actualProfit);
        }
      }
    }

    const avgProtectedAmount = beWorkedTrades.length > 0 ? totalProtected / beWorkedTrades.length : 0;
    const avgMissedOpportunity = beFailedTrades.length > 0 ? totalMissed / beFailedTrades.length : 0;
    const netBEImpact = totalProtected - totalMissed;

    // Determine optimal BE level based on performance
    let optimalBELevel = 40; // Default
    let recommendedAction: BEEfficiencyMetrics['recommendedAction'] = 'maintain_current';

    if (beSuccessRate > 70 && netBEImpact > 0) {
      optimalBELevel = 35; // More aggressive
      recommendedAction = 'increase_be_usage';
    } else if (beSuccessRate < 40 && netBEImpact < -100) {
      optimalBELevel = 50; // More conservative
      recommendedAction = 'decrease_be_usage';
    } else if (avgMissedOpportunity > avgProtectedAmount * 1.5) {
      recommendedAction = 'optimize_timing';
    }

    return {
      beSuccessRate,
      avgProtectedAmount,
      avgMissedOpportunity,
      netBEImpact,
      optimalBELevel,
      recommendedAction
    };
  }

  /**
   * Generate personalized BE recommendations
   */
  static async generatePersonalizedRecommendations(userId: string): Promise<{
    stopLossRecommendations: string[];
    takeProfitRecommendations: string[];
    breakEvenRecommendations: string[];
    riskManagementScore: number;
  }> {
    const [slOptimizations, tpOptimizations, beEfficiency] = await Promise.all([
      this.calculateStopLossOptimization(userId),
      this.calculateTakeProfitOptimization(userId),
      this.calculateBEEfficiency(userId)
    ]);

    const stopLossRecommendations: string[] = [];
    const takeProfitRecommendations: string[] = [];
    const breakEvenRecommendations: string[] = [];

    // Stop Loss recommendations
    const avgRiskReduction = slOptimizations.reduce((sum, opt) => sum + opt.riskReduction, 0) / slOptimizations.length;
    if (avgRiskReduction > 10) {
      stopLossRecommendations.push('Consider tightening stop losses to reduce average risk by ' + avgRiskReduction.toFixed(1) + '%');
    } else if (avgRiskReduction < -10) {
      stopLossRecommendations.push('Consider widening stop losses to give trades more room to work');
    }

    // Take Profit recommendations
    const avgAdditionalProfit = tpOptimizations.reduce((sum, opt) => sum + opt.additionalProfit, 0) / tpOptimizations.length;
    if (avgAdditionalProfit > 50) {
      takeProfitRecommendations.push('More aggressive take profit levels could add $' + avgAdditionalProfit.toFixed(2) + ' per trade on average');
    }

    const avgCaptureImprovement = tpOptimizations.reduce((sum, opt) => sum + opt.captureImprovement, 0) / tpOptimizations.length;
    if (avgCaptureImprovement > 15) {
      takeProfitRecommendations.push('Optimizing take profit levels could improve profit capture by ' + avgCaptureImprovement.toFixed(1) + '%');
    }

    // Break Even recommendations
    if (beEfficiency.recommendedAction === 'increase_be_usage') {
      breakEvenRecommendations.push('Your break-even strategy is working well - consider using it more frequently');
    } else if (beEfficiency.recommendedAction === 'decrease_be_usage') {
      breakEvenRecommendations.push('Break-even stops may be hurting your performance - consider being more selective');
    } else if (beEfficiency.recommendedAction === 'optimize_timing') {
      breakEvenRecommendations.push('Focus on better break-even timing - currently missing too many opportunities');
    }

    if (beEfficiency.beSuccessRate > 0) {
      breakEvenRecommendations.push(`Your break-even success rate is ${beEfficiency.beSuccessRate.toFixed(1)}% with optimal level around ${beEfficiency.optimalBELevel}%`);
    }

    // Calculate overall risk management score
    let riskManagementScore = 50; // Base score

    // Bonus for good BE performance
    if (beEfficiency.beSuccessRate > 60) riskManagementScore += 20;
    if (beEfficiency.netBEImpact > 0) riskManagementScore += 10;

    // Bonus for risk reduction opportunities
    if (avgRiskReduction > 5) riskManagementScore += 10;

    // Bonus for profit capture opportunities
    if (avgCaptureImprovement > 10) riskManagementScore += 10;

    riskManagementScore = Math.min(100, Math.max(0, riskManagementScore));

    return {
      stopLossRecommendations,
      takeProfitRecommendations,
      breakEvenRecommendations,
      riskManagementScore
    };
  }

  /**
   * Calculate what-if scenario for BE field changes
   */
  static calculateBEWhatIf(originalTrade: TradeWithBEData, modifications: Partial<TradeWithBEData>): {
    originalMetrics: any;
    modifiedMetrics: any;
    improvement: {
      profitChange: number;
      riskChange: number;
      efficiencyChange: number;
    };
  } {
    // This would integrate with the main what-if analysis service
    // For now, return a basic structure

    const modifiedTrade = { ...originalTrade, ...modifications };

    // Calculate basic metrics for both scenarios
    const originalMetrics = this.calculateBasicTradeMetrics(originalTrade);
    const modifiedMetrics = this.calculateBasicTradeMetrics(modifiedTrade);

    const profitChange = (modifiedMetrics.pnl || 0) - (originalMetrics.pnl || 0);
    const riskChange = (modifiedMetrics.risk || 0) - (originalMetrics.risk || 0);
    const efficiencyChange = (modifiedMetrics.efficiency || 0) - (originalMetrics.efficiency || 0);

    return {
      originalMetrics,
      modifiedMetrics,
      improvement: {
        profitChange,
        riskChange,
        efficiencyChange
      }
    };
  }

  /**
   * Calculate basic trade metrics for what-if scenarios
   */
  private static calculateBasicTradeMetrics(trade: TradeWithBEData) {
    if (!trade.exitPrice) {
      return { pnl: null, risk: null, efficiency: null };
    }

    const isLong = trade.direction === 'LONG';
    const pnl = isLong ?
      (trade.exitPrice - trade.entryPrice) * trade.quantity :
      (trade.entryPrice - trade.exitPrice) * trade.quantity;

    const risk = trade.stopLoss ?
      Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity : null;

    let efficiency = null;
    if (trade.maxPotentialProfit) {
      const maxProfit = isLong ?
        (trade.maxPotentialProfit - trade.entryPrice) * trade.quantity :
        (trade.entryPrice - trade.maxPotentialProfit) * trade.quantity;

      efficiency = maxProfit > 0 ? (Math.max(0, pnl) / maxProfit) * 100 : 0;
    }

    return { pnl, risk, efficiency };
  }
}