import { User, Trade, Strategy } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    details?: any;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// Trade types
export interface CreateTradeRequest {
  symbol: string;
  market?: string;
  direction: 'LONG' | 'SHORT';
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
  entryDate: string;
  entryPrice: number;
  quantity: number;
  exitDate?: string;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  strategyId?: string;
  timeframe?: string;
  notes?: string;
  imageUrl?: string;
}

export interface UpdateTradeRequest extends Partial<CreateTradeRequest> {}

export interface TradeFilters {
  page?: number;
  limit?: number;
  symbol?: string;
  market?: string;
  strategyId?: string;
  direction?: 'LONG' | 'SHORT';
  result?: 'WIN' | 'LOSS' | 'BREAKEVEN';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Strategy types
export interface CreateStrategyRequest {
  name: string;
  description?: string;
}

export interface UpdateStrategyRequest extends Partial<CreateStrategyRequest> {}

// Stats types
export interface DashboardStats {
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgRMultiple: number;
  sharpeRatio: number;
}

export interface ProfitLossChartData {
  date: string;
  cumulative: number;
  daily: number;
}

export interface EfficiencyAnalysis {
  avgEfficiency: number;
  bestEfficiency: number;
  worstEfficiency: number;
  efficiencyDistribution: {
    range: string;
    min: number;
    max: number;
    count: number;
  }[];
  totalMissedProfit: number;
}

export interface WhatIfScenario {
  scenario: string;
  originalPnL: number;
  scenarioPnL: number;
  difference: number;
  improvement: number;
}

export interface StrategyPerformance extends DashboardStats {
  strategy: string;
}

// User types
export interface UpdateUserSettingsRequest {
  commission?: number;
  timezone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Extended types with relations
export interface TradeWithStrategy extends Trade {
  strategy?: Strategy | null;
}

export interface StrategyWithCount extends Strategy {
  _count: {
    trades: number;
  };
}

export interface UserProfile extends Omit<User, 'password'> {
  _count: {
    trades: number;
    strategies: number;
  };
}

// Export market types
export * from './market';

// Re-export key market interfaces for convenience
export type { MarketInfo, ContractSpecification, MarketDefaultsResponse } from './market';