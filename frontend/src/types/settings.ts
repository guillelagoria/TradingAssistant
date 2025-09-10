// Strategy types
export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  category?: string;
  timeframe?: string;
  tags?: string[];
  isActive: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
  
  // Strategy stats (optional, can be calculated)
  totalTrades?: number;
  winRate?: number;
  avgReturn?: number;
  maxDrawdown?: number;
}

// Commission types
export interface Commission {
  id: string;
  name: string;
  exchange: string;
  makerFee: number;
  takerFee: number;
  currency: string;
  type: 'percentage' | 'fixed';
  isDefault?: boolean;
  
  // Optional additional fees
  swapFee?: number;
  withdrawalFee?: number;
  depositFee?: number;
  
  // Tiered pricing (optional)
  tiers?: CommissionTier[];
}

export interface CommissionTier {
  minVolume: number;
  maxVolume?: number;
  makerFee: number;
  takerFee: number;
}

// Symbol types for favorites
export interface Symbol {
  symbol: string;
  name?: string;
  category?: 'forex' | 'crypto' | 'stocks' | 'indices' | 'commodities';
  exchange?: string;
  isActive: boolean;
}

// Common timeframes
export const TIMEFRAMES = [
  '1m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M'
] as const;

export type Timeframe = typeof TIMEFRAMES[number];

// Trading session hours
export interface TradingSession {
  name: string;
  start: string; // HH:MM format
  end: string;   // HH:MM format
  timezone: string;
  isActive: boolean;
}

// Risk management settings
export interface RiskSettings {
  maxRiskPerTrade: number;        // Percentage of account
  maxDailyLoss: number;           // Percentage of account
  maxConsecutiveLosses: number;   // Number of trades
  maxDrawdown: number;            // Percentage of account
  positionSizeMethod: 'fixed' | 'percentage' | 'kelly' | 'risk-based';
  
  // Alerts
  enableRiskAlerts: boolean;
  riskAlertThresholds: {
    dailyLoss: number;
    drawdown: number;
    consecutiveLosses: number;
  };
}

// Default values for new strategies
export const DEFAULT_STRATEGY: Omit<Strategy, 'id' | 'createdAt'> = {
  name: '',
  description: '',
  rules: '',
  category: 'Custom',
  timeframe: '1h',
  tags: [],
  isActive: true,
  isDefault: false,
};

// Default commission settings
export const DEFAULT_COMMISSION: Omit<Commission, 'id'> = {
  name: '',
  exchange: '',
  makerFee: 0.1,
  takerFee: 0.1,
  currency: 'USD',
  type: 'percentage',
  isDefault: false,
};

// Popular trading symbols by category
export const POPULAR_SYMBOLS = {
  forex: [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'EURAUD', 'EURCHF', 'AUDCAD',
    'GBPCAD', 'GBPCHF', 'CHFJPY', 'EURNZD', 'AUDCHF', 'CADJPY'
  ],
  crypto: [
    'BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD', 'LTCUSD', 'BCHUSD',
    'XLMUSD', 'XRPUSD', 'EOSUSD', 'TRXUSD', 'ETCUSD', 'DASHUSD', 'ZECUSD',
    'XMRUSD', 'IOTUSD', 'NEOUSD', 'OMGUSD', 'QTUMUSD', 'ZRXUSD'
  ],
  stocks: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'PYPL', 'ADBE', 'CRM', 'ORCL', 'NOW', 'UBER',
    'LYFT', 'ZOOM', 'DOCU', 'SHOP'
  ],
  indices: [
    'SPX500', 'NAS100', 'US30', 'UK100', 'GER30', 'FRA40', 'AUS200',
    'JPN225', 'HKG33', 'EUSTX50', 'ESP35', 'ITA40', 'CHI50', 'IND50'
  ],
  commodities: [
    'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'USOIL', 'UKOIL', 'NGAS',
    'WHEAT', 'CORN', 'SOYBEAN', 'SUGAR', 'COTTON', 'COFFEE', 'COCOA'
  ]
} as const;

// Validation schemas
export interface StrategyValidation {
  name: { required: true; minLength: 1; maxLength: 50 };
  description: { maxLength: 200 };
  rules: { maxLength: 1000 };
  timeframe: { enum: typeof TIMEFRAMES };
}

export interface CommissionValidation {
  name: { required: true; minLength: 1; maxLength: 50 };
  exchange: { required: true; minLength: 1; maxLength: 30 };
  makerFee: { min: 0; max: 100 };
  takerFee: { min: 0; max: 100 };
  currency: { required: true; minLength: 3; maxLength: 3 };
}