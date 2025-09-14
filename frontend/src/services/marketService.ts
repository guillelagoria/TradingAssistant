import { api } from './api';

// Market Info interface matching backend simplified format
export interface MarketInfo {
  id: string;
  symbol: string;
  name: string;
  category: string;
  exchange: string;

  // Essential contract details
  tickSize: number;
  tickValue: number;
  pointValue: number;
  currency: string;
  precision: number;

  // Commission and margins
  commission: number;
  initialMargin: number;
  dayTradingMargin?: number;

  // Risk management defaults
  defaultStopLossPercent: number;
  defaultTakeProfitPercent: number;
  maxPositionSize: number;
  riskPercentage: number;

  // Trading status
  isActive: boolean;
}

export interface MarketDefaults {
  tickSize: number;
  tickValue: number;
  pointValue: number;
  currency: string;
  commission: number;
  initialMargin: number;
  dayTradingMargin?: number;
  riskPercentage: number;
  riskAmount: number;
  maxPositionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  suggestedQuantity?: number;
  suggestedStopLoss?: number;
  suggestedTakeProfit?: number;
}

export interface MarketValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PositionSizeRequest {
  riskAmount: number;
  entryPrice: number;
  stopLoss: number;
}

export interface PositionSizeResult {
  suggestedQuantity: number;
  riskAmount: number;
  potentialLoss: number;
  marginRequired: number;
  contractValue: number;
}

class MarketService {
  /**
   * Get all available markets in simplified format
   */
  async getMarketsInfo(): Promise<MarketInfo[]> {
    try {
      const response = await api.get<{ data: MarketInfo[]; success: boolean; message?: string }>('/api/markets/info');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch markets info:', error);
      throw new Error('Failed to fetch market information');
    }
  }

  /**
   * Get specific market info in simplified format
   */
  async getMarketInfo(symbol: string): Promise<MarketInfo> {
    try {
      const response = await api.get<{ data: MarketInfo; success: boolean; message?: string }>(`/api/markets/info/${symbol}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch market info for ${symbol}:`, error);
      throw new Error(`Failed to fetch information for ${symbol}`);
    }
  }

  /**
   * Get market defaults for trade form
   */
  async getMarketDefaults(symbol: string): Promise<MarketDefaults> {
    try {
      const response = await api.get<MarketDefaults>(`/api/markets/${symbol}/defaults`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch market defaults for ${symbol}:`, error);
      throw new Error(`Failed to fetch defaults for ${symbol}`);
    }
  }

  /**
   * Validate trade parameters for a specific market
   */
  async validateTrade(
    symbol: string,
    params: {
      entryPrice: number;
      quantity: number;
      stopLoss?: number;
      takeProfit?: number;
    }
  ): Promise<MarketValidationResult> {
    try {
      const response = await api.post<MarketValidationResult>(
        `/api/markets/${symbol}/validate`,
        params
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to validate trade for ${symbol}:`, error);
      throw new Error(`Failed to validate trade parameters`);
    }
  }

  /**
   * Calculate optimal position size
   */
  async calculatePositionSize(
    symbol: string,
    params: PositionSizeRequest
  ): Promise<PositionSizeResult> {
    try {
      const response = await api.post<PositionSizeResult>(
        `/api/markets/${symbol}/position-size`,
        params
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to calculate position size for ${symbol}:`, error);
      throw new Error(`Failed to calculate position size`);
    }
  }
}

export const marketService = new MarketService();