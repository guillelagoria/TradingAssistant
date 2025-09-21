import { PrismaClient } from '@prisma/client';
import { capabilitiesCacheService } from './capabilitiesCache.service';

const prisma = new PrismaClient();

export interface DataCapabilities {
  accountId: string;
  totalTrades: number;
  dataQualityBreakdown: {
    basic: number;
    enhanced: number;
    complete: number;
  };
  availableMetrics: {
    basic: string[];
    advanced: string[];
    missing: string[];
  };
  recommendations: {
    type: 'upgrade' | 'import' | 'complete';
    message: string;
    action: string;
  }[];
  capabilityScore: number; // 0-100 score based on data completeness
}

export interface MetricAvailability {
  mae: boolean;
  mfe: boolean;
  efficiency: boolean;
  riskRealization: boolean;
  timeAnalysis: boolean;
  nt8Metadata: boolean;
}

class DataCapabilitiesService {
  /**
   * Analyze data capabilities for an account with caching
   */
  async analyzeAccountCapabilities(accountId: string, userId: string, useCache: boolean = true): Promise<DataCapabilities> {
    // Try to get from cache first
    if (useCache) {
      const cached = capabilitiesCacheService.get(accountId, userId);
      if (cached) {
        return cached;
      }
    }
    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        trades: {
          select: {
            id: true,
            dataQuality: true,
            hasAdvancedData: true,
            mae: true,
            mfe: true,
            etd: true,
            bars: true,
            durationMinutes: true,
            maeEfficiency: true,
            mfeEfficiency: true,
            riskRealization: true,
            tradeNumber: true,
            nt8Strategy: true,
            entryName: true,
            exitName: true,
            source: true,
            exitDate: true
          }
        }
      }
    });

    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const trades = account.trades;
    const totalTrades = trades.length;

    // Calculate data quality breakdown
    const dataQualityBreakdown = trades.reduce((acc, trade) => {
      const quality = (trade.dataQuality || 'BASIC').toLowerCase() as 'basic' | 'enhanced' | 'complete';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, { basic: 0, enhanced: 0, complete: 0 });

    // Analyze metric availability
    const metricAvailability = this.analyzeMetricAvailability(trades);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dataQualityBreakdown, metricAvailability, totalTrades);

    // Calculate capability score
    const capabilityScore = this.calculateCapabilityScore(dataQualityBreakdown, totalTrades);

    const result: DataCapabilities = {
      accountId,
      totalTrades,
      dataQualityBreakdown,
      availableMetrics: {
        basic: this.getBasicMetrics(),
        advanced: this.getAdvancedMetrics(metricAvailability),
        missing: this.getMissingMetrics(metricAvailability)
      },
      recommendations,
      capabilityScore
    };

    // Cache the result
    if (useCache) {
      capabilitiesCacheService.set(accountId, userId, result);
    }

    return result;
  }

  /**
   * Analyze which metrics are available based on trade data
   */
  private analyzeMetricAvailability(trades: any[]): MetricAvailability {
    const completedTrades = trades.filter(t => t.exitDate);

    if (completedTrades.length === 0) {
      return {
        mae: false,
        mfe: false,
        efficiency: false,
        riskRealization: false,
        timeAnalysis: false,
        nt8Metadata: false
      };
    }

    const hasMAE = completedTrades.some(t => t.mae !== null && t.mae !== undefined);
    const hasMFE = completedTrades.some(t => t.mfe !== null && t.mfe !== undefined);
    const hasETD = completedTrades.some(t => t.etd !== null && t.etd !== undefined);
    const hasBars = completedTrades.some(t => t.bars !== null && t.bars !== undefined);
    const hasNT8Metadata = completedTrades.some(t =>
      t.tradeNumber || t.nt8Strategy || t.entryName || t.exitName
    );
    const hasEfficiencyMetrics = completedTrades.some(t =>
      t.maeEfficiency !== null || t.mfeEfficiency !== null || t.riskRealization !== null
    );

    return {
      mae: hasMAE,
      mfe: hasMFE,
      efficiency: hasEfficiencyMetrics,
      riskRealization: hasEfficiencyMetrics,
      timeAnalysis: hasETD || hasBars,
      nt8Metadata: hasNT8Metadata
    };
  }

  /**
   * Generate recommendations based on data analysis
   */
  private generateRecommendations(
    breakdown: { basic: number; enhanced: number; complete: number },
    availability: MetricAvailability,
    totalTrades: number
  ): DataCapabilities['recommendations'] {
    const recommendations: DataCapabilities['recommendations'] = [];

    // If mostly basic trades, recommend CSV import
    if (breakdown.basic > totalTrades * 0.7 && totalTrades > 5) {
      recommendations.push({
        type: 'import',
        message: 'Import NinjaTrader 8 CSV data for advanced analytics',
        action: 'Upload your NT8 trade export CSV file to unlock MAE/MFE analysis, efficiency metrics, and timing data'
      });
    }

    // If no MAE/MFE data available
    if (!availability.mae && !availability.mfe && totalTrades > 0) {
      recommendations.push({
        type: 'upgrade',
        message: 'Enable advanced excursion analysis',
        action: 'Track Maximum Adverse Excursion (MAE) and Maximum Favorable Excursion (MFE) to improve your trade timing'
      });
    }

    // If no time analysis available
    if (!availability.timeAnalysis && totalTrades > 3) {
      recommendations.push({
        type: 'complete',
        message: 'Add timing analysis to your trades',
        action: 'Import complete NT8 data to analyze trade duration and entry-to-drawdown patterns'
      });
    }

    // If no NT8 metadata but have some advanced data
    if (!availability.nt8Metadata && (availability.mae || availability.mfe)) {
      recommendations.push({
        type: 'complete',
        message: 'Connect trading strategy metadata',
        action: 'Link your trades to specific strategies and entry/exit signals for comprehensive analysis'
      });
    }

    return recommendations;
  }

  /**
   * Calculate a capability score from 0-100
   */
  private calculateCapabilityScore(
    breakdown: { basic: number; enhanced: number; complete: number },
    totalTrades: number
  ): number {
    if (totalTrades === 0) return 0;

    const weights = { basic: 1, enhanced: 2, complete: 3 };
    const maxScore = totalTrades * weights.complete;
    const currentScore =
      breakdown.basic * weights.basic +
      breakdown.enhanced * weights.enhanced +
      breakdown.complete * weights.complete;

    return Math.round((currentScore / maxScore) * 100);
  }

  /**
   * Get list of basic metrics always available
   */
  private getBasicMetrics(): string[] {
    return [
      'Total P&L',
      'Win Rate',
      'Average Win/Loss',
      'Profit Factor',
      'Win/Loss Streaks',
      'Total Trades',
      'ROI'
    ];
  }

  /**
   * Get list of advanced metrics available based on data
   */
  private getAdvancedMetrics(availability: MetricAvailability): string[] {
    const advanced: string[] = [];

    if (availability.mae) advanced.push('Maximum Adverse Excursion (MAE)');
    if (availability.mfe) advanced.push('Maximum Favorable Excursion (MFE)');
    if (availability.efficiency) advanced.push('Trade Efficiency Analysis');
    if (availability.riskRealization) advanced.push('Risk Realization Metrics');
    if (availability.timeAnalysis) advanced.push('Trade Duration Analysis');
    if (availability.nt8Metadata) advanced.push('Strategy Performance Breakdown');

    return advanced;
  }

  /**
   * Get list of missing advanced metrics
   */
  private getMissingMetrics(availability: MetricAvailability): string[] {
    const missing: string[] = [];

    if (!availability.mae) missing.push('Maximum Adverse Excursion (MAE)');
    if (!availability.mfe) missing.push('Maximum Favorable Excursion (MFE)');
    if (!availability.efficiency) missing.push('Trade Efficiency Analysis');
    if (!availability.riskRealization) missing.push('Risk Realization Metrics');
    if (!availability.timeAnalysis) missing.push('Trade Duration Analysis');
    if (!availability.nt8Metadata) missing.push('Strategy Performance Breakdown');

    return missing;
  }

  /**
   * Check if account has sufficient data for specific analysis type
   */
  async hasCapabilityForAnalysis(
    accountId: string,
    userId: string,
    analysisType: 'basic' | 'efficiency' | 'timing' | 'strategy'
  ): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
      include: {
        trades: {
          select: {
            mae: true,
            mfe: true,
            etd: true,
            bars: true,
            nt8Strategy: true,
            hasAdvancedData: true,
            exitDate: true
          }
        }
      }
    });

    if (!account) return false;

    const completedTrades = account.trades.filter(t => t.exitDate);

    switch (analysisType) {
      case 'basic':
        return completedTrades.length > 0;

      case 'efficiency':
        return completedTrades.some(t =>
          (t.mae !== null && t.mae !== undefined) &&
          (t.mfe !== null && t.mfe !== undefined)
        );

      case 'timing':
        return completedTrades.some(t =>
          t.etd !== null || t.bars !== null
        );

      case 'strategy':
        return completedTrades.some(t =>
          t.nt8Strategy !== null && t.nt8Strategy !== undefined
        );

      default:
        return false;
    }
  }

  /**
   * Invalidate cache for an account (call when trades are added/modified/deleted)
   */
  invalidateAccountCache(accountId: string, userId: string): void {
    capabilitiesCacheService.invalidate(accountId, userId);
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return capabilitiesCacheService.getStats();
  }

  /**
   * Start cache cleanup process
   */
  startCacheCleanup(): void {
    capabilitiesCacheService.startPeriodicCleanup();
  }
}

export const dataCapabilitiesService = new DataCapabilitiesService();