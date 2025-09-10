import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { TradeService } from './trade.service';
import { calculateTradeStats, calculateTradeMetrics } from '../utils/calculations';

const prisma = new PrismaClient();

interface WhatIfOptions {
  tradeIds?: string[];
  scenarios?: string[];
  includeCache?: boolean;
}

interface GenerateWhatIfOptions {
  tradeIds?: string[];
  scenarios?: string[];
  customScenarios?: any[];
  accountSize?: number;
}

interface SuggestionOptions {
  tradeIds?: string[];
  priority?: string;
  category?: string;
}

interface PortfolioOptions {
  period: string;
  includeOpenTrades: boolean;
}

interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  category: 'entry' | 'exit' | 'risk' | 'selection' | 'management';
  color: string;
}

// In-memory cache for analysis results (in production, use Redis)
const analysisCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export class AnalysisService {
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get cached analysis result or return null
   */
  private static getCachedResult(cacheKey: string): any | null {
    const cached = analysisCache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      analysisCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache analysis result
   */
  private static setCachedResult(cacheKey: string, data: any, ttl: number = this.CACHE_TTL): void {
    analysisCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get available What-If scenarios
   */
  static getAvailableScenarios(): WhatIfScenario[] {
    return [
      {
        id: 'better_entry',
        name: 'Better Entry Timing',
        description: 'What if you had 5% better entry prices on all trades?',
        category: 'entry',
        color: '#10B981'
      },
      {
        id: 'better_exit',
        name: 'Better Exit Timing',
        description: 'What if you had 5% better exit prices on all trades?',
        category: 'exit',
        color: '#3B82F6'
      },
      {
        id: 'proper_position_sizing',
        name: 'Proper Position Sizing',
        description: 'What if you risked exactly 2% on every trade?',
        category: 'risk',
        color: '#8B5CF6'
      },
      {
        id: 'winning_setups_only',
        name: 'Winning Setups Only',
        description: 'What if you only traded your winning setups?',
        category: 'selection',
        color: '#F59E0B'
      },
      {
        id: 'tighter_stops',
        name: 'Tighter Stop Losses',
        description: 'What if you had 20% tighter stop losses?',
        category: 'risk',
        color: '#EF4444'
      },
      {
        id: 'scaling_out',
        name: 'Position Scaling',
        description: 'What if you scaled out 50% at first target?',
        category: 'management',
        color: '#06B6D4'
      },
      {
        id: 'optimal_stop_loss',
        name: 'Optimal Stop Loss',
        description: 'What if you used data-driven optimal stop loss levels?',
        category: 'risk',
        color: '#DC2626'
      },
      {
        id: 'remove_worst_trades',
        name: 'Remove Worst 10%',
        description: 'What if you avoided your worst 10% of trades?',
        category: 'selection',
        color: '#EA580C'
      },
      {
        id: 'best_day_only',
        name: 'Best Trading Days',
        description: 'What if you only traded on your most profitable days?',
        category: 'selection',
        color: '#CA8A04'
      },
      {
        id: 'trailing_stops',
        name: 'Trailing Stop Loss',
        description: 'What if you used trailing stops to maximize profits?',
        category: 'management',
        color: '#0891B2'
      },
      {
        id: 'risk_reward_filter',
        name: '1:2 Risk-Reward Filter',
        description: 'What if you only took trades with 1:2+ risk-reward?',
        category: 'selection',
        color: '#7C2D12'
      },
      {
        id: 'market_condition_filter',
        name: 'Market Condition Filter',
        description: 'What if you avoided trading in unfavorable conditions?',
        category: 'selection',
        color: '#4338CA'
      }
    ];
  }

  /**
   * Get What-If analysis for user's trades
   */
  static async getWhatIfAnalysis(userId: string, options: WhatIfOptions) {
    try {
      const cacheKey = `whatif-${userId}-${JSON.stringify(options)}`;
      
      // Check cache first
      if (options.includeCache) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          logger.info(`Returning cached What-If analysis for user ${userId}`);
          return cached;
        }
      }

      // Get user's trades
      const trades = await TradeService.getUserTrades(userId, {
        tradeIds: options.tradeIds,
        includeCalculations: true
      });

      if (trades.length === 0) {
        return {
          originalStats: calculateTradeStats([]),
          scenarios: [],
          topImprovements: [],
          summary: {
            bestScenario: null,
            totalPotentialImprovement: 0,
            keyInsights: ['No trades available for analysis.']
          }
        };
      }

      // Run What-If analysis (this would use the same logic as frontend)
      const analysis = await this.runWhatIfCalculations(trades, options.scenarios);

      // Cache the result
      this.setCachedResult(cacheKey, analysis);

      logger.info(`Generated What-If analysis for user ${userId} with ${trades.length} trades`);
      return analysis;
    } catch (error) {
      logger.error('Error in getWhatIfAnalysis:', error);
      throw error;
    }
  }

  /**
   * Generate What-If analysis with custom parameters
   */
  static async generateWhatIfAnalysis(userId: string, options: GenerateWhatIfOptions) {
    try {
      // Get user's trades
      const trades = await TradeService.getUserTrades(userId, {
        tradeIds: options.tradeIds,
        includeCalculations: true
      });

      if (trades.length === 0) {
        throw new Error('No trades found for analysis');
      }

      // Run analysis with custom parameters
      const analysis = await this.runWhatIfCalculations(
        trades, 
        options.scenarios, 
        options.accountSize,
        options.customScenarios
      );

      logger.info(`Generated custom What-If analysis for user ${userId}`);
      return analysis;
    } catch (error) {
      logger.error('Error in generateWhatIfAnalysis:', error);
      throw error;
    }
  }

  /**
   * Get improvement suggestions based on trading performance
   */
  static async getImprovementSuggestions(userId: string, options: SuggestionOptions) {
    try {
      const cacheKey = `suggestions-${userId}-${JSON.stringify(options)}`;
      
      // Check cache first
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      // Get what-if analysis first
      const whatIfAnalysis = await this.getWhatIfAnalysis(userId, {
        tradeIds: options.tradeIds,
        includeCache: true
      });

      // Generate suggestions based on analysis
      const suggestions = await this.generateSmartSuggestions(whatIfAnalysis, options);

      // Cache suggestions for shorter time (5 minutes)
      this.setCachedResult(cacheKey, suggestions, 5 * 60 * 1000);

      return suggestions;
    } catch (error) {
      logger.error('Error in getImprovementSuggestions:', error);
      throw error;
    }
  }

  /**
   * Get portfolio-level analysis
   */
  static async getPortfolioAnalysis(userId: string, options: PortfolioOptions) {
    try {
      const cacheKey = `portfolio-${userId}-${JSON.stringify(options)}`;
      
      // Check cache first
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached;
      }

      // Get user's trades based on period
      const trades = await this.getTradesByPeriod(userId, options.period, options.includeOpenTrades);

      // Calculate portfolio metrics
      const analysis = {
        overview: {
          totalTrades: trades.length,
          totalPnL: trades.reduce((sum, trade) => sum + (trade.netPnl || 0), 0),
          winRate: trades.filter(t => (t.pnl || 0) > 0).length / trades.length * 100,
          profitFactor: this.calculateProfitFactor(trades),
          sharpeRatio: this.calculateSharpeRatio(trades),
          maxDrawdown: this.calculateMaxDrawdown(trades)
        },
        symbolAnalysis: this.analyzeBySymbol(trades),
        strategyAnalysis: this.analyzeByStrategy(trades),
        timeAnalysis: this.analyzeByTime(trades),
        riskMetrics: this.calculateRiskMetrics(trades),
        correlations: this.calculateCorrelations(trades),
        heatMap: this.generateHeatMap(trades)
      };

      // Cache for longer period (30 minutes)
      this.setCachedResult(cacheKey, analysis, 30 * 60 * 1000);

      return analysis;
    } catch (error) {
      logger.error('Error in getPortfolioAnalysis:', error);
      throw error;
    }
  }

  /**
   * Run What-If calculations (simplified backend version)
   */
  private static async runWhatIfCalculations(
    trades: any[], 
    scenarios?: string[], 
    accountSize: number = 100000,
    customScenarios?: any[]
  ) {
    // This is a simplified version - in a real implementation,
    // you'd port the frontend calculation logic here
    const originalStats = calculateTradeStats(trades);
    const availableScenarios = this.getAvailableScenarios();
    
    const scenariosToRun = scenarios 
      ? availableScenarios.filter(s => scenarios.includes(s.id))
      : availableScenarios;

    const results = scenariosToRun.map(scenario => {
      // Simplified scenario calculations
      const improvement = this.calculateScenarioImprovement(trades, scenario, accountSize);
      
      return {
        scenario,
        originalStats,
        improvedStats: {
          ...originalStats,
          netPnl: originalStats.netPnl + improvement.totalPnlImprovement,
          winRate: originalStats.winRate + improvement.winRateImprovement,
          profitFactor: originalStats.profitFactor + improvement.profitFactorImprovement
        },
        improvement,
        insights: this.generateScenarioInsights(scenario, improvement, trades.length)
      };
    });

    const topImprovements = results
      .sort((a, b) => b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement)
      .slice(0, 3);

    return {
      originalStats,
      scenarios: results,
      topImprovements,
      summary: {
        bestScenario: topImprovements[0] || null,
        totalPotentialImprovement: topImprovements.reduce((sum, r) => sum + Math.max(0, r.improvement.totalPnlImprovement), 0),
        keyInsights: this.generateKeyInsights(topImprovements, originalStats)
      }
    };
  }

  /**
   * Calculate simplified scenario improvements
   */
  private static calculateScenarioImprovement(trades: any[], scenario: WhatIfScenario, accountSize: number) {
    // Simplified calculation - real implementation would be more complex
    const totalPnL = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
    const totalTrades = trades.length;

    let improvement = {
      totalPnlImprovement: 0,
      totalPnlImprovementPercent: 0,
      winRateImprovement: 0,
      profitFactorImprovement: 0,
      avgRMultipleImprovement: 0,
      tradesAffected: 0
    };

    switch (scenario.id) {
      case 'better_entry':
      case 'better_exit':
        improvement.totalPnlImprovement = Math.abs(totalPnL) * 0.15; // 15% improvement
        improvement.tradesAffected = totalTrades;
        break;
      case 'proper_position_sizing':
        improvement.totalPnlImprovement = Math.abs(totalPnL) * 0.25; // 25% improvement
        improvement.winRateImprovement = 2;
        improvement.tradesAffected = totalTrades;
        break;
      case 'winning_setups_only':
        improvement.totalPnlImprovement = Math.abs(totalPnL) * 0.4; // 40% improvement
        improvement.winRateImprovement = 15;
        improvement.tradesAffected = totalTrades - winningTrades;
        break;
      default:
        improvement.totalPnlImprovement = Math.abs(totalPnL) * 0.1; // 10% improvement
        improvement.tradesAffected = totalTrades;
    }

    improvement.totalPnlImprovementPercent = totalPnL !== 0 ? (improvement.totalPnlImprovement / Math.abs(totalPnL)) * 100 : 0;
    improvement.profitFactorImprovement = improvement.totalPnlImprovement / 1000; // Simplified
    improvement.avgRMultipleImprovement = improvement.winRateImprovement / 10; // Simplified

    return improvement;
  }

  /**
   * Generate scenario-specific insights
   */
  private static generateScenarioInsights(scenario: WhatIfScenario, improvement: any, totalTrades: number): string[] {
    const insights = [];
    
    if (improvement.totalPnlImprovement > 0) {
      insights.push(`This scenario could improve your total P&L by $${improvement.totalPnlImprovement.toFixed(2)}.`);
    }
    
    insights.push(`${improvement.tradesAffected} out of ${totalTrades} trades would be affected.`);
    
    switch (scenario.category) {
      case 'entry':
        insights.push('Focus on improving entry timing through better market analysis and patience.');
        break;
      case 'exit':
        insights.push('Develop clear exit criteria and stick to your trading plan.');
        break;
      case 'risk':
        insights.push('Consistent risk management provides better risk-adjusted returns.');
        break;
      case 'selection':
        insights.push('Analyze trade patterns to identify and avoid poor setups.');
        break;
      case 'management':
        insights.push('Better trade management can help optimize profit capture.');
        break;
    }
    
    return insights;
  }

  /**
   * Generate key insights from top improvements
   */
  private static generateKeyInsights(topImprovements: any[], originalStats: any): string[] {
    const insights = [];
    
    if (topImprovements.length > 0) {
      const best = topImprovements[0];
      insights.push(`${best.scenario.name} offers the highest improvement potential: $${best.improvement.totalPnlImprovement.toFixed(2)}.`);
      
      const highImpact = topImprovements.filter(r => r.improvement.totalPnlImprovementPercent > 10);
      if (highImpact.length > 0) {
        insights.push(`${highImpact.length} scenarios could improve your returns by more than 10%.`);
      }
    }
    
    if (originalStats.winRate < 50) {
      insights.push('Focus on trade quality to improve your win rate.');
    }
    
    return insights;
  }

  /**
   * Generate smart suggestions (simplified)
   */
  private static async generateSmartSuggestions(whatIfAnalysis: any, options: SuggestionOptions) {
    const suggestions = [];
    
    // Generate suggestions based on top improvements
    for (const result of whatIfAnalysis.topImprovements.slice(0, 3)) {
      const suggestion = {
        id: `suggestion-${result.scenario.id}`,
        title: `Implement ${result.scenario.name}`,
        description: result.scenario.description,
        priority: result.improvement.totalPnlImprovementPercent > 20 ? 'high' : 
                 result.improvement.totalPnlImprovementPercent > 10 ? 'medium' : 'low',
        category: result.scenario.category,
        potentialImprovement: result.improvement.totalPnlImprovement,
        timeToImplement: 'medium',
        difficulty: 'medium',
        actionSteps: result.insights,
        relatedScenarios: [result.scenario.name]
      };
      
      // Apply filters
      if (options.priority && suggestion.priority !== options.priority) continue;
      if (options.category && suggestion.category !== options.category) continue;
      
      suggestions.push(suggestion);
    }
    
    return suggestions;
  }

  /**
   * Get trades by time period
   */
  private static async getTradesByPeriod(userId: string, period: string, includeOpenTrades: boolean) {
    let dateFilter: any = {};
    const now = new Date();
    
    switch (period) {
      case '1m':
        dateFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '3m':
        dateFilter = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '6m':
        dateFilter = { gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
      default:
        dateFilter = undefined;
    }

    const where: any = { userId };
    if (dateFilter) {
      where.entryDate = dateFilter;
    }
    if (!includeOpenTrades) {
      where.exitDate = { not: null };
    }

    return await prisma.trade.findMany({
      where,
      orderBy: { entryDate: 'desc' }
    });
  }

  // Helper methods for portfolio analysis (simplified implementations)
  private static calculateProfitFactor(trades: any[]): number {
    const winners = trades.filter(t => (t.pnl || 0) > 0);
    const losers = trades.filter(t => (t.pnl || 0) < 0);
    
    const totalWins = winners.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    return totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  }

  private static calculateSharpeRatio(trades: any[]): number {
    // Simplified Sharpe ratio calculation
    const returns = trades.map(t => (t.pnlPercentage || 0) / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  }

  private static calculateMaxDrawdown(trades: any[]): number {
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    trades.forEach(trade => {
      runningPnL += trade.netPnl || 0;
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  }

  private static analyzeBySymbol(trades: any[]) {
    // Group trades by symbol and analyze performance
    const symbolMap = new Map();
    
    trades.forEach(trade => {
      if (!symbolMap.has(trade.symbol)) {
        symbolMap.set(trade.symbol, []);
      }
      symbolMap.get(trade.symbol).push(trade);
    });
    
    return Array.from(symbolMap.entries()).map(([symbol, symbolTrades]) => ({
      symbol,
      totalTrades: symbolTrades.length,
      totalPnL: symbolTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0),
      winRate: symbolTrades.filter((t: any) => (t.pnl || 0) > 0).length / symbolTrades.length * 100,
      avgTrade: symbolTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0) / symbolTrades.length
    }));
  }

  private static analyzeByStrategy(trades: any[]) {
    // Similar to symbol analysis but for strategies
    const strategyMap = new Map();
    
    trades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategyMap.has(strategy)) {
        strategyMap.set(strategy, []);
      }
      strategyMap.get(strategy).push(trade);
    });
    
    return Array.from(strategyMap.entries()).map(([strategy, strategyTrades]) => ({
      strategy,
      totalTrades: strategyTrades.length,
      totalPnL: strategyTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0),
      winRate: strategyTrades.filter((t: any) => (t.pnl || 0) > 0).length / strategyTrades.length * 100,
      avgTrade: strategyTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0) / strategyTrades.length
    }));
  }

  private static analyzeByTime(trades: any[]) {
    // Analyze performance by different time periods
    const hourMap = new Map();
    const dayMap = new Map();
    const monthMap = new Map();
    
    trades.forEach(trade => {
      const entryDate = new Date(trade.entryDate);
      const hour = entryDate.getHours();
      const day = entryDate.getDay();
      const month = entryDate.getMonth();
      
      // Hour analysis
      if (!hourMap.has(hour)) hourMap.set(hour, []);
      hourMap.get(hour).push(trade);
      
      // Day analysis
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day).push(trade);
      
      // Month analysis
      if (!monthMap.has(month)) monthMap.set(month, []);
      monthMap.get(month).push(trade);
    });
    
    return {
      byHour: Array.from(hourMap.entries()).map(([hour, hourTrades]) => ({
        hour,
        totalTrades: hourTrades.length,
        totalPnL: hourTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0),
        winRate: hourTrades.filter((t: any) => (t.pnl || 0) > 0).length / hourTrades.length * 100
      })),
      byDay: Array.from(dayMap.entries()).map(([day, dayTrades]) => ({
        day,
        totalTrades: dayTrades.length,
        totalPnL: dayTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0),
        winRate: dayTrades.filter((t: any) => (t.pnl || 0) > 0).length / dayTrades.length * 100
      })),
      byMonth: Array.from(monthMap.entries()).map(([month, monthTrades]) => ({
        month,
        totalTrades: monthTrades.length,
        totalPnL: monthTrades.reduce((sum: number, t: any) => sum + (t.netPnl || 0), 0),
        winRate: monthTrades.filter((t: any) => (t.pnl || 0) > 0).length / monthTrades.length * 100
      }))
    };
  }

  private static calculateRiskMetrics(trades: any[]) {
    const risks = trades.map(t => t.riskAmount || 0).filter(r => r > 0);
    const returns = trades.map(t => t.netPnl || 0);
    
    return {
      avgRiskPerTrade: risks.reduce((sum, r) => sum + r, 0) / risks.length || 0,
      maxRisk: Math.max(...risks) || 0,
      minRisk: Math.min(...risks) || 0,
      riskStdDev: this.calculateStandardDeviation(risks),
      returnStdDev: this.calculateStandardDeviation(returns),
      riskAdjustedReturn: this.calculateRiskAdjustedReturn(trades)
    };
  }

  private static calculateStandardDeviation(values: number[]): number {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, sq) => sum + sq, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  private static calculateRiskAdjustedReturn(trades: any[]): number {
    // Simplified risk-adjusted return calculation
    const totalReturn = trades.reduce((sum, t) => sum + (t.netPnl || 0), 0);
    const totalRisk = trades.reduce((sum, t) => sum + Math.abs(t.riskAmount || 0), 0);
    
    return totalRisk > 0 ? totalReturn / totalRisk : 0;
  }

  private static calculateCorrelations(trades: any[]) {
    // Simplified correlation analysis between symbols and strategies
    const symbols = [...new Set(trades.map(t => t.symbol))];
    const strategies = [...new Set(trades.map(t => t.strategy))];
    
    return {
      symbolCorrelations: this.calculateSymbolCorrelations(trades, symbols),
      strategyCorrelations: this.calculateStrategyCorrelations(trades, strategies)
    };
  }

  private static calculateSymbolCorrelations(trades: any[], symbols: string[]) {
    // Simplified correlation matrix
    const correlations: any[][] = [];
    
    symbols.forEach((symbol1, i) => {
      correlations[i] = [];
      symbols.forEach((symbol2, j) => {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          const trades1 = trades.filter(t => t.symbol === symbol1);
          const trades2 = trades.filter(t => t.symbol === symbol2);
          correlations[i][j] = this.calculatePearsonCorrelation(
            trades1.map(t => t.pnlPercentage || 0),
            trades2.map(t => t.pnlPercentage || 0)
          );
        }
      });
    });
    
    return { symbols, correlations };
  }

  private static calculateStrategyCorrelations(trades: any[], strategies: string[]) {
    // Similar to symbol correlations but for strategies
    const correlations: any[][] = [];
    
    strategies.forEach((strategy1, i) => {
      correlations[i] = [];
      strategies.forEach((strategy2, j) => {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          const trades1 = trades.filter(t => t.strategy === strategy1);
          const trades2 = trades.filter(t => t.strategy === strategy2);
          correlations[i][j] = this.calculatePearsonCorrelation(
            trades1.map(t => t.pnlPercentage || 0),
            trades2.map(t => t.pnlPercentage || 0)
          );
        }
      });
    });
    
    return { strategies, correlations };
  }

  private static calculatePearsonCorrelation(x: number[], y: number[]): number {
    // Simplified Pearson correlation coefficient
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static generateHeatMap(trades: any[]) {
    // Generate a heat map of performance by day of week and hour of day
    const heatMap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    const countMap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    trades.forEach(trade => {
      const entryDate = new Date(trade.entryDate);
      const dayOfWeek = entryDate.getDay();
      const hour = entryDate.getHours();
      
      heatMap[dayOfWeek][hour] += trade.netPnl || 0;
      countMap[dayOfWeek][hour]++;
    });
    
    // Calculate averages
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        if (countMap[day][hour] > 0) {
          heatMap[day][hour] = heatMap[day][hour] / countMap[day][hour];
        }
      }
    }
    
    return {
      data: heatMap,
      counts: countMap,
      labels: {
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        hours: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      }
    };
  }
}