/**
 * Types for Break-Even Analysis and Optimization
 */

export interface BEAnalysisMetrics {
  // Core BE Metrics
  beSuccessRate: number;        // Percentage of trades where BE worked
  beFailureRate: number;        // Percentage where BE hurt the trade
  avgBEDistance: number;        // Average distance from entry to BE
  optimalBELevel: number;       // Calculated optimal BE placement

  // Profit Capture Analysis
  avgProfitCaptureRate: number; // How much of max profit was captured
  missedProfitFromBE: number;   // Total profit lost due to BE stops
  protectedProfitFromBE: number; // Total profit saved by BE stops

  // Risk Management
  avgDrawdownBeforeBE: number;  // Average drawdown before hitting BE
  drawdownTolerance: number;    // How much drawdown can be tolerated
  riskReductionFromBE: number;  // Risk reduced by using BE

  // Performance Comparison
  performanceWithBE: number;    // Total P&L with BE
  performanceWithoutBE: number; // Simulated P&L without BE
  beImpact: number;            // Net impact of using BE
}

export interface BEOptimizationScenario {
  scenarioName: string;
  description: string;

  // BE Settings
  beLevel: number;              // Where to place BE (as % of target)
  beTrigger: number;            // When to move to BE (as % of target)
  useTrailingBE: boolean;      // Whether to use trailing BE

  // Expected Results
  expectedSuccessRate: number;
  expectedProfitCapture: number;
  expectedRiskReduction: number;

  // Backtested Results (when available)
  actualSuccessRate?: number;
  actualProfitCapture?: number;
  actualRiskReduction?: number;
  recommendationScore: number;  // 0-100 score for this scenario
}

export interface BERecommendation {
  shouldUseBE: boolean;
  optimalBEDistance: number;    // Points from entry
  optimalBETrigger: number;     // Points of profit before moving
  confidence: number;           // 0-100 confidence in recommendation
  reasoning: string[];          // List of reasons for recommendation

  // Alternative strategies
  alternatives: {
    strategy: 'no-be' | 'aggressive-be' | 'conservative-be' | 'trailing-be';
    expectedImprovement: number;
    description: string;
  }[];
}

export interface TradeWithBEAnalysis {
  tradeId: string;

  // Original trade data
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;

  // BE specific data
  breakEvenWorked: boolean;
  maxPotentialProfit: number;
  maxDrawdown: number;

  // Calculated BE metrics
  profitCaptureRate: number;
  beEfficiency: number;
  optimalBEForThisTrade: number;

  // What-if scenarios
  profitIfNoBE: number;
  profitIfOptimalBE: number;
  profitIfTrailingBE: number;
}

export interface BEPattern {
  patternName: string;
  description: string;

  // Pattern conditions
  marketCondition: 'trending' | 'ranging' | 'volatile';
  timeframe: string;
  symbol: string;

  // BE settings for this pattern
  recommendedBE: number;
  successRate: number;
  sampleSize: number;

  // Performance metrics
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
}

export interface BEStatsByStrategy {
  strategy: string;
  totalTrades: number;
  tradesWithBE: number;

  // Success metrics
  beWorkedCount: number;
  beFailedCount: number;
  beSuccessRate: number;

  // Financial impact
  profitProtected: number;
  profitMissed: number;
  netBEImpact: number;

  // Optimization
  currentBESettings: {
    avgBEDistance: number;
    avgBETrigger: number;
  };
  optimalBESettings: {
    recommendedDistance: number;
    recommendedTrigger: number;
    expectedImprovement: number;
  };
}

export interface BEFilterOptions {
  showOnlyBETrades: boolean;
  showBEWorked: boolean;
  showBEFailed: boolean;
  minProfitCapture?: number;
  maxDrawdown?: number;
  strategy?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Utility type for BE calculations
export interface BECalculationInput {
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit?: number;
  maxPotentialProfit?: number;
  maxDrawdown?: number;
  breakEvenWorked?: boolean;
  direction: 'long' | 'short';
}

export interface BECalculationResult {
  profitCaptureRate: number;
  beEfficiency: number;
  drawdownTolerance: number;
  optimalBEDistance: number;
  riskRewardWithBE: number;
  potentialImprovement: number;
}