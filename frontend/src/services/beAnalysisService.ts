import { api } from './api';

export interface BEStatsData {
  totalTrades: number;
  tradesWithBE: number;
  beSuccessRate: number;
  avgProfitCaptureRate: number;
  totalProtectedProfit: number;
  totalMissedProfit: number;
  netBEImpact: number;
  recommendedStrategy: string;
  optimalBELevel?: number;
}

export interface BEScenario {
  scenarioName: string;
  description: string;
  beLevel: number;
  beTrigger: number;
  useTrailingBE: boolean;
  expectedSuccessRate: number;
  expectedProfitCapture: number;
  expectedRiskReduction: number;
  recommendationScore: number;
  simulatedProfit?: number;
  simulatedLoss?: number;
}

export interface BERecommendations {
  shouldUseBE: boolean;
  recommendedStrategy: string;
  optimalBELevel: number;
  confidence: number;
  keyInsights: string[];
  topScenario: BEScenario;
  portfolioMetrics: BEStatsData;
  allScenarios: BEScenario[];
}

export interface BEEfficiencyMetrics {
  beSuccessRate: number;
  profitCaptureRate: number;
  stopLossOptimizationScore: number;
  takeProfitOptimizationScore: number;
  overallEfficiency: number;
  historicalTrend: {
    period: string;
    successRate: number;
    profitCapture: number;
  }[];
  recommendations: {
    type: 'improvement' | 'warning' | 'success';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export class BEAnalysisService {

  /**
   * Get portfolio-level BE metrics
   */
  static async getBEMetrics(accountId?: string): Promise<BEStatsData> {
    try {
      const params = accountId ? { accountId } : {};
      const response = await api.get('/api/analysis/be/metrics', { params });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch BE metrics');
    }
  }

  /**
   * Get BE optimization scenarios
   */
  static async getBEScenarios(accountId?: string): Promise<BEScenario[]> {
    try {
      const params = accountId ? { accountId } : {};
      const response = await api.get('/api/analysis/be/scenarios', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching BE scenarios:', error);
      throw new Error('Failed to fetch BE scenarios');
    }
  }

  /**
   * Get comprehensive BE recommendations
   */
  static async getBERecommendations(accountId?: string): Promise<BERecommendations> {
    try {
      const params = accountId ? { accountId } : {};
      const response = await api.get('/api/analysis/be/recommendations', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching BE recommendations:', error);
      throw new Error('Failed to fetch BE recommendations');
    }
  }

  /**
   * Get BE efficiency metrics with trends
   */
  static async getBEEfficiencyMetrics(period: string = '3m', accountId?: string): Promise<BEEfficiencyMetrics> {
    try {
      const params: any = { period };
      if (accountId) params.accountId = accountId;

      const response = await api.get('/api/analysis/be/effectiveness', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching BE efficiency metrics:', error);
      throw new Error('Failed to fetch BE efficiency metrics');
    }
  }

  /**
   * Get stop loss optimization score
   */
  static async getStopLossOptimization(accountId?: string): Promise<{
    currentScore: number;
    potentialImprovement: number;
    recommendations: string[];
  }> {
    try {
      const params = accountId ? { accountId } : {};
      const response = await api.get('/api/analysis/be/stop-loss-optimization', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching stop loss optimization:', error);
      throw new Error('Failed to fetch stop loss optimization');
    }
  }

  /**
   * Get take profit optimization score
   */
  static async getTakeProfitOptimization(accountId?: string): Promise<{
    currentScore: number;
    potentialImprovement: number;
    recommendations: string[];
  }> {
    try {
      const params = accountId ? { accountId } : {};
      const response = await api.get('/api/analysis/be/take-profit-optimization', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching take profit optimization:', error);
      throw new Error('Failed to fetch take profit optimization');
    }
  }

  /**
   * Get risk-adjusted metrics comparing BE vs non-BE performance
   */
  static async getRiskAdjustedMetrics(period: string = '3m', accountId?: string): Promise<{
    withBE: {
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      avgReturn: number;
    };
    withoutBE: {
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      avgReturn: number;
    };
    improvement: {
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      avgReturn: number;
    };
  }> {
    try {
      const params: any = { period };
      if (accountId) params.accountId = accountId;

      const response = await api.get('/api/analysis/be/risk-adjusted', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching risk-adjusted metrics:', error);
      throw new Error('Failed to fetch risk-adjusted metrics');
    }
  }

  /**
   * Get portfolio impact analysis
   */
  static async getPortfolioImpact(period: string = '3m', accountSize?: number, accountId?: string): Promise<{
    totalImpact: number;
    monthlyImpact: number;
    impactPercentage: number;
    riskReduction: number;
    consistencyImprovement: number;
    projectedAnnualBenefit: number;
  }> {
    try {
      const params: any = { period };
      if (accountSize) params.accountSize = accountSize;
      if (accountId) params.accountId = accountId;

      const response = await api.get('/api/analysis/be/portfolio-impact', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio impact:', error);
      throw new Error('Failed to fetch portfolio impact');
    }
  }

  /**
   * Validate BE fields for a trade
   */
  static async validateBEFields(tradeData: {
    direction: 'LONG' | 'SHORT';
    entryPrice: number;
    quantity: number;
    maxPotentialProfit?: number;
    maxDrawdown?: number;
    takeProfit?: number;
    stopLoss?: number;
    breakEvenWorked?: boolean;
  }, accountId?: string): Promise<{
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      const payload = {
        ...tradeData,
        ...(accountId && { accountId })
      };
      const response = await api.post('/api/analysis/be/validate', payload);
      return response.data;
    } catch (error) {
      console.error('Error validating BE fields:', error);
      throw new Error('Failed to validate BE fields');
    }
  }

  /**
   * Calculate what-if scenario for BE modifications
   */
  static async calculateBEWhatIf(originalTrade: any, modifications: any, accountId?: string): Promise<{
    originalPnL: number;
    modifiedPnL: number;
    improvement: number;
    improvementPercentage: number;
    confidence: number;
    recommendation: string;
  }> {
    try {
      const payload = {
        originalTrade,
        modifications,
        ...(accountId && { accountId })
      };
      const response = await api.post('/api/analysis/be/what-if', payload);
      return response.data;
    } catch (error) {
      console.error('Error calculating BE what-if:', error);
      throw new Error('Failed to calculate BE what-if scenario');
    }
  }
}

export default BEAnalysisService;