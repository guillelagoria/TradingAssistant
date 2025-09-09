export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

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
}

export interface TradeFilters {
  symbol?: string;
  direction?: TradeDirection;
  result?: TradeResult;
  strategy?: Strategy;
  timeframe?: Timeframe;
  dateFrom?: Date;
  dateTo?: Date;
  pnlMin?: number;
  pnlMax?: number;
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