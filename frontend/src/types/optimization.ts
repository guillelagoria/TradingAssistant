export interface StopLossOptimization {
  avgMAEWinners: number;
  avgMAELosers: number;
  avgMAEWinnersPoints: number;
  avgMAELosersPoints: number;
  recommendedStop: number;
  recommendedStopPoints: number;
  stopsAvoided: number;
  stopsAvoidedPercent: number;
  percentile75MAE: number;
  insight: string;
  symbolPointValue: number;
}

export interface TakeProfitOptimization {
  avgMFEAchieved: number;
  avgMFEPoints: number;
  avgExitMFE: number;
  potentialLeftOnTable: number;
  recommendedTarget: number;
  recommendedTargetPoints: number;
  captureRate: number;
  partialExitSuggestion: string;
  insight: string;
  symbolPointValue: number;
}

export interface RiskRewardSetup {
  currentAvgRR: number;
  currentWinRate: number;
  currentExpectancy: number;
  suggestedStop: number;
  suggestedStopPoints: number;
  suggestedTarget: number;
  suggestedTargetPoints: number;
  suggestedRR: number;
  breakEvenWinRate: number;
  expectedPnLPerTrade: number;
  comparison: string;
  symbolPointValue: number;
}

export interface TimingEfficiency {
  bestEntryHours: Array<{
    hour: number;
    avgPnL: number;
    winRate: number;
    trades: number;
  }>;
  avgDurationWinners: number;
  avgDurationLosers: number;
  suggestedTimeStop: number;
  breakEvenStats: {
    reachedBE: number;
    reachedBEPercent: number;
    continuedProfit: number;
    continuedProfitPercent: number;
  };
  insight: string;
}

export interface OptimizationInsights {
  stopLoss: StopLossOptimization | null;
  takeProfit: TakeProfitOptimization | null;
  riskReward: RiskRewardSetup | null;
  timing: TimingEfficiency | null;
  minTradesRequired: number;
  currentTrades: number;
  hasEnoughData: boolean;
  dataQuality: {
    hasMAE: number;
    hasMFE: number;
    hasBE: number;
    hasAdvanced: number;
  };
}
