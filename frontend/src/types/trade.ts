export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export type Direction = 'long' | 'short';

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT'
}

export enum TradeResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  BREAKEVEN = 'BREAKEVEN'
}

export enum TradeStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED'
}

export enum Strategy {
  SCALPING = 'SCALPING',
  DAY_TRADING = 'DAY_TRADING',
  SWING = 'SWING',
  POSITION = 'POSITION',
  CUSTOM = 'CUSTOM'
}

export enum Timeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1h',
  H4 = '4h',
  D1 = '1d',
  W1 = '1w',
  MN1 = '1M'
}

export interface TradeFormData {
  // Entry Tab
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  orderType: OrderType;
  
  // Exit Tab
  exitPrice?: number;
  exitDate?: Date;
  result?: TradeResult;
  
  // Risk Management Tab
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  riskAmount?: number;
  riskPercentage?: number;
  
  // Analysis Tab
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  maxPotentialProfit?: number;  // NEW: Max profit price reached before reversal
  maxDrawdown?: number;          // NEW: Max drawdown before going to profit
  breakEvenWorked?: boolean;     // NEW: Whether BE protected the trade
  notes?: string;
  strategy: Strategy;
  timeframe: Timeframe;
  imageUrl?: string;
  customStrategy?: string;
}

export interface Trade extends TradeFormData {
  id: string;
  userId?: string;
  status: TradeStatus;
  createdAt: Date;
  updatedAt: Date;

  // Calculated fields
  pnl: number;
  pnlPercentage: number;
  efficiency: number;
  rMultiple: number;
  commission: number;
  netPnl: number;
  holdingPeriod?: number; // in minutes

  // BE Analysis metrics (calculated)
  beEfficiency?: number;       // How well BE performed
  profitCaptureRate?: number;  // actualProfit / maxPotentialProfit
  drawdownTolerance?: number;  // maxDrawdown / stopLossDistance
}

export interface TradeCalculationResult {
  pnl: number;
  pnlPercentage: number;
  efficiency: number;
  rMultiple: number;
  commission: number;
  netPnl: number;
  maxDrawdown?: number;
  maxGain?: number;
  holdingPeriod?: number;

  // BE Analysis results
  beEfficiency?: number;
  profitCaptureRate?: number;
  drawdownTolerance?: number;
  optimalBEDistance?: number;
}

export interface TradeFilters {
  // Basic filters
  symbol?: string;
  direction?: TradeDirection;
  result?: TradeResult;
  strategy?: Strategy;
  timeframe?: Timeframe;
  orderType?: OrderType;
  
  // Date filters
  dateFrom?: Date;
  dateTo?: Date;
  datePreset?: DatePreset;
  
  // P&L filters
  pnlMin?: number;
  pnlMax?: number;
  
  // Advanced range filters
  rMultipleMin?: number;
  rMultipleMax?: number;
  positionSizeMin?: number;
  positionSizeMax?: number;
  efficiencyMin?: number;
  efficiencyMax?: number;
  holdingPeriodMin?: number; // in minutes
  holdingPeriodMax?: number; // in minutes
  
  // Text search
  searchTerm?: string;
  searchFields?: SearchField[];
  
  // Multiple selection filters
  strategies?: Strategy[];
  symbols?: string[];
  
  // Quick filters
  quickFilter?: QuickFilterType;
}

export enum DatePreset {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  THIS_WEEK = 'THIS_WEEK',
  LAST_WEEK = 'LAST_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  LAST_MONTH = 'LAST_MONTH',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_YEAR = 'THIS_YEAR',
  CUSTOM = 'CUSTOM'
}

export enum SearchField {
  SYMBOL = 'symbol',
  NOTES = 'notes',
  STRATEGY = 'strategy',
  CUSTOM_STRATEGY = 'customStrategy',
  ALL = 'all'
}

export enum QuickFilterType {
  WINNING_TRADES = 'WINNING_TRADES',
  LOSING_TRADES = 'LOSING_TRADES',
  BREAKEVEN_TRADES = 'BREAKEVEN_TRADES',
  LARGE_POSITIONS = 'LARGE_POSITIONS',
  SHORT_TERM_TRADES = 'SHORT_TERM_TRADES',
  LONG_TERM_TRADES = 'LONG_TERM_TRADES',
  HIGH_R_MULTIPLE = 'HIGH_R_MULTIPLE',
  LOW_R_MULTIPLE = 'LOW_R_MULTIPLE',
  HIGH_EFFICIENCY = 'HIGH_EFFICIENCY',
  OPEN_TRADES = 'OPEN_TRADES',
  CLOSED_TRADES = 'CLOSED_TRADES'
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: TradeFilters;
  isDefault?: boolean;
  userId?: string;
}

export interface TradeSortConfig {
  field: keyof Trade;
  direction: 'asc' | 'desc';
}

export interface TradeStats {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxWin: number;
  maxLoss: number;
  avgRMultiple: number;
  avgEfficiency: number;
  totalCommission: number;
  netPnl: number;

  // BE Statistics
  tradesWithBE: number;
  beSuccessRate: number;      // % of times BE worked
  avgProfitCaptureRate: number; // Average profit capture
  avgDrawdownTolerance: number; // Average drawdown tolerance
  beProtectedProfit: number;   // Total profit protected by BE
}

export interface PositionSizeCalculation {
  positionSize: number;
  riskAmount: number;
  sharesOrContracts: number;
  marginRequired?: number;
}

export interface TradeFormErrors {
  symbol?: string;
  direction?: string;
  entryPrice?: string;
  quantity?: string;
  entryDate?: string;
  exitPrice?: string;
  exitDate?: string;
  stopLoss?: string;
  takeProfit?: string;
  positionSize?: string;
  riskAmount?: string;
  riskPercentage?: string;
  strategy?: string;
  timeframe?: string;
  general?: string;
}

// Draft trade for auto-save functionality
export interface TradeDraft {
  id?: string;
  formData: Partial<TradeFormData>;
  lastSaved: Date;
  currentTab: number;
}

// New simplified types for the modern trade system
export interface MarketInfo {
  symbol: string;
  displayName: string;
  tickValue: number;
  pointValue: number;
  tickSize: number;
  commission: number;
  currency: string;
  marketHours?: {
    open: string;
    close: string;
    timezone: string;
  };
}

export interface NewTrade {
  // Market info
  marketInfo: MarketInfo;

  // Essential prices
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;

  // Simple metadata
  moodRating: 1 | 2 | 3 | 4 | 5;
  imageUrl?: string;

  // Optional fields
  maxFavorablePrice?: number;
  maxAdversePrice?: number;
  maxPotentialProfit?: number;  // NEW
  maxDrawdown?: number;          // NEW
  breakEvenWorked?: boolean;     // NEW
  notes?: string;

  // Auto-calculated fields
  direction: Direction;
  pnlPoints: number;
  pnlUsd: number;
  riskRewardRatio: number;
  efficiency: number;

  // System fields
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface TradeFormState {
  marketInfo: MarketInfo | null;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  moodRating: 1 | 2 | 3 | 4 | 5;
  imageUrl: string;
  maxFavorablePrice: string;
  maxAdversePrice: string;
  maxPotentialProfit: string;   // NEW
  maxDrawdown: string;           // NEW
  breakEvenWorked: boolean;      // NEW
  notes: string;
}

export interface TradeCalculations {
  direction: Direction;
  pnlPoints: number;
  pnlUsd: number;
  riskPoints: number;
  rewardPoints: number;
  riskRewardRatio: number;
  efficiency: number;
  isValid: boolean;
  errors: string[];
}

export type MoodRating = 1 | 2 | 3 | 4 | 5;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Form validation types
export interface TradeFormValidation {
  isValid: boolean;
  errors: Partial<Record<keyof TradeFormState, string>>;
  warnings: Partial<Record<keyof TradeFormState, string>>;
}

// Animation states for form transitions
export interface FormAnimationState {
  isCalculating: boolean;
  showResults: boolean;
  slideDirection: 'left' | 'right' | 'none';
  fadeState: 'in' | 'out' | 'none';
}