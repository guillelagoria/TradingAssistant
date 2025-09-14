// Market configuration types for futures contracts and other trading instruments

// Market categories
export enum MarketCategory {
  FUTURES = 'futures',
  FOREX = 'forex',
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  INDICES = 'indices',
  COMMODITIES = 'commodities',
}

// Futures contract types
export enum FuturesType {
  INDEX = 'index',
  COMMODITY = 'commodity',
  CURRENCY = 'currency',
  ENERGY = 'energy',
  BOND = 'bond',
}

// Exchange definitions
export enum Exchange {
  CME = 'CME',        // Chicago Mercantile Exchange
  CBOT = 'CBOT',      // Chicago Board of Trade
  NYMEX = 'NYMEX',    // New York Mercantile Exchange
  COMEX = 'COMEX',    // Commodity Exchange
  ICE = 'ICE',        // Intercontinental Exchange
  EUREX = 'EUREX',    // Eurex Exchange
  NASDAQ = 'NASDAQ',  // NASDAQ
  NYSE = 'NYSE',      // New York Stock Exchange
}

// Contract specifications interface
export interface ContractSpecification {
  id: string;
  symbol: string;
  name: string;
  description: string;
  category: MarketCategory;
  futuresType?: FuturesType;
  exchange: Exchange;

  // Contract details
  contractSize: number;                    // Number of units per contract
  tickSize: number;                       // Minimum price increment
  tickValue: number;                      // Dollar value per tick
  pointValue: number;                     // Dollar value per point
  minimumMove: number;                    // Minimum price move

  // Trading specifications
  currency: string;                       // Base currency (USD, EUR, etc.)
  quoteCurrency?: string;                 // Quote currency for FX
  precision: number;                      // Decimal places for prices

  // Margin requirements
  initialMargin: number;                  // Initial margin per contract
  maintenanceMargin: number;              // Maintenance margin per contract
  dayTradingMargin?: number;             // Intraday margin requirement

  // Trading hours (in UTC)
  tradingHours: TradingHours;

  // Commission structure
  defaultCommission: CommissionStructure;

  // Risk management defaults
  riskDefaults: RiskDefaults;

  // Market specific settings
  settings: MarketSettings;

  // Contract months (for futures)
  contractMonths?: string[];              // ['MAR', 'JUN', 'SEP', 'DEC']

  // Additional metadata
  isActive: boolean;
  lastTradingDay?: string;               // Pattern for last trading day
  deliveryMethod?: 'cash' | 'physical';
  settlementType?: 'daily' | 'final';
}

// Trading hours interface
export interface TradingHours {
  timezone: string;                       // Trading timezone
  sessions: TradingSession[];
  holidays?: string[];                    // Holiday calendar
}

export interface TradingSession {
  name: string;                          // 'Regular', 'Overnight', 'Pre-Market'
  startTime: string;                     // HH:MM format
  endTime: string;                       // HH:MM format
  daysOfWeek: number[];                  // [0-6] Sunday = 0
}

// Commission structure
export interface CommissionStructure {
  type: 'per_contract' | 'per_share' | 'percentage';
  amount: number;                        // Base commission amount
  minimum?: number;                      // Minimum commission
  maximum?: number;                      // Maximum commission
  exchange?: number;                     // Exchange fees
  clearing?: number;                     // Clearing fees
  nfa?: number;                         // NFA fees (US futures)
  regulation?: number;                   // Regulatory fees
}

// Risk management defaults
export interface RiskDefaults {
  defaultStopLossPercent: number;        // Default SL as percentage of price
  defaultTakeProfitPercent: number;      // Default TP as percentage of price
  maxPositionSize: number;               // Max contracts/shares per position
  riskPerTradePercent: number;           // Default risk per trade (% of account)
  maxDailyRisk: number;                  // Max daily risk (% of account)

  // Position sizing
  defaultPositionSizing: PositionSizingMethod;
  accountSizeForCalculation?: number;    // Default account size for calculations
}

export enum PositionSizingMethod {
  FIXED = 'fixed',                       // Fixed number of contracts
  RISK_BASED = 'risk_based',            // Based on risk amount
  PERCENTAGE = 'percentage',             // Percentage of account
  VOLATILITY = 'volatility',            // Based on ATR or volatility
}

// Market-specific settings
export interface MarketSettings {
  // Price display
  showFullContractValue: boolean;        // Show full contract value vs per-point
  priceFormat: string;                   // Number format string

  // Calculations
  includeFees: boolean;                  // Include fees in P&L calculations
  autoCalculateMargin: boolean;          // Auto-calculate margin requirements

  // UI preferences
  defaultChartTimeframe: string;         // Default timeframe for charts
  preferredOrderTypes: string[];        // Preferred order types for this market

  // Alerts
  enableVolumeAlerts: boolean;          // Enable volume-based alerts
  enablePriceAlerts: boolean;           // Enable price movement alerts

  // Analysis
  enableSeasonality: boolean;           // Enable seasonal analysis
  enableCorrelation: boolean;           // Enable correlation analysis
}

// Market preset configurations
export interface MarketPreset {
  id: string;
  name: string;
  description: string;
  contractSpecs: ContractSpecification[];
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Pre-defined market configurations
export const ES_FUTURES: ContractSpecification = {
  id: 'es_futures',
  symbol: 'ES',
  name: 'E-mini S&P 500',
  description: 'E-mini S&P 500 futures contract',
  category: MarketCategory.FUTURES,
  futuresType: FuturesType.INDEX,
  exchange: Exchange.CME,

  contractSize: 1,                       // 1 contract
  tickSize: 0.25,                       // 0.25 points
  tickValue: 12.5,                      // $12.50 per tick
  pointValue: 50,                       // $50 per point
  minimumMove: 0.25,

  currency: 'USD',
  precision: 2,

  initialMargin: 13200,                 // $13,200 per contract
  maintenanceMargin: 12000,             // $12,000 per contract
  dayTradingMargin: 6600,               // $6,600 intraday

  tradingHours: {
    timezone: 'America/Chicago',
    sessions: [
      {
        name: 'Regular',
        startTime: '08:30',
        endTime: '15:15',
        daysOfWeek: [1, 2, 3, 4, 5],     // Monday-Friday
      },
      {
        name: 'Overnight',
        startTime: '17:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Sunday-Saturday
      }
    ],
  },

  defaultCommission: {
    type: 'per_contract',
    amount: 4.00,                        // $4.00 per round turn
    exchange: 1.02,                      // CME fees
    clearing: 0.02,                      // Clearing fees
    nfa: 0.02,                          // NFA fees
  },

  riskDefaults: {
    defaultStopLossPercent: 1.0,         // 1% stop loss
    defaultTakeProfitPercent: 2.0,       // 2% take profit
    maxPositionSize: 10,                 // Max 10 contracts
    riskPerTradePercent: 1.0,           // 1% risk per trade
    maxDailyRisk: 3.0,                  // 3% max daily risk
    defaultPositionSizing: PositionSizingMethod.RISK_BASED,
    accountSizeForCalculation: 100000,   // $100K default account
  },

  settings: {
    showFullContractValue: true,
    priceFormat: '0.00',
    includeFees: true,
    autoCalculateMargin: true,
    defaultChartTimeframe: '15m',
    preferredOrderTypes: ['MARKET', 'LIMIT', 'STOP'],
    enableVolumeAlerts: true,
    enablePriceAlerts: true,
    enableSeasonality: true,
    enableCorrelation: true,
  },

  contractMonths: ['MAR', 'JUN', 'SEP', 'DEC'],
  isActive: true,
  lastTradingDay: 'Third Friday of contract month',
  deliveryMethod: 'cash',
  settlementType: 'daily',
};

export const NQ_FUTURES: ContractSpecification = {
  id: 'nq_futures',
  symbol: 'NQ',
  name: 'E-mini NASDAQ 100',
  description: 'E-mini NASDAQ 100 futures contract',
  category: MarketCategory.FUTURES,
  futuresType: FuturesType.INDEX,
  exchange: Exchange.CME,

  contractSize: 1,                       // 1 contract
  tickSize: 0.25,                       // 0.25 points
  tickValue: 5.00,                      // $5.00 per tick
  pointValue: 20,                       // $20 per point
  minimumMove: 0.25,

  currency: 'USD',
  precision: 2,

  initialMargin: 19800,                 // $19,800 per contract
  maintenanceMargin: 18000,             // $18,000 per contract
  dayTradingMargin: 9900,               // $9,900 intraday

  tradingHours: {
    timezone: 'America/Chicago',
    sessions: [
      {
        name: 'Regular',
        startTime: '08:30',
        endTime: '15:15',
        daysOfWeek: [1, 2, 3, 4, 5],     // Monday-Friday
      },
      {
        name: 'Overnight',
        startTime: '17:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Sunday-Saturday
      }
    ],
  },

  defaultCommission: {
    type: 'per_contract',
    amount: 4.00,                        // $4.00 per round turn
    exchange: 1.02,                      // CME fees
    clearing: 0.02,                      // Clearing fees
    nfa: 0.02,                          // NFA fees
  },

  riskDefaults: {
    defaultStopLossPercent: 1.2,         // 1.2% stop loss (NQ more volatile)
    defaultTakeProfitPercent: 2.4,       // 2.4% take profit
    maxPositionSize: 8,                  // Max 8 contracts (higher margin)
    riskPerTradePercent: 1.5,           // 1.5% risk per trade
    maxDailyRisk: 4.0,                  // 4% max daily risk
    defaultPositionSizing: PositionSizingMethod.RISK_BASED,
    accountSizeForCalculation: 100000,   // $100K default account
  },

  settings: {
    showFullContractValue: true,
    priceFormat: '0.00',
    includeFees: true,
    autoCalculateMargin: true,
    defaultChartTimeframe: '15m',
    preferredOrderTypes: ['MARKET', 'LIMIT', 'STOP'],
    enableVolumeAlerts: true,
    enablePriceAlerts: true,
    enableSeasonality: true,
    enableCorrelation: true,
  },

  contractMonths: ['MAR', 'JUN', 'SEP', 'DEC'],
  isActive: true,
  lastTradingDay: 'Third Friday of contract month',
  deliveryMethod: 'cash',
  settlementType: 'daily',
};

// Additional popular futures contracts
export const POPULAR_FUTURES_CONTRACTS: ContractSpecification[] = [
  ES_FUTURES,
  NQ_FUTURES,
  // Can be extended with more contracts like YM, RTY, CL, GC, etc.
];

// Market preset for futures traders
export const FUTURES_TRADER_PRESET: MarketPreset = {
  id: 'futures_trader',
  name: 'Futures Trader',
  description: 'Complete setup for ES and NQ futures trading',
  contractSpecs: [ES_FUTURES, NQ_FUTURES],
  isDefault: true,
  createdAt: new Date().toISOString(),
};

// Available market presets
export const MARKET_PRESETS: MarketPreset[] = [
  FUTURES_TRADER_PRESET,
];

// Utility functions for market calculations
export interface MarketCalculations {
  calculateContractValue: (price: number, contractSpec: ContractSpecification) => number;
  calculateMarginRequirement: (contracts: number, contractSpec: ContractSpecification, isDayTrade?: boolean) => number;
  calculateCommission: (contracts: number, contractSpec: ContractSpecification) => number;
  calculatePositionSize: (riskAmount: number, entryPrice: number, stopPrice: number, contractSpec: ContractSpecification) => number;
  calculatePipValue: (contractSpec: ContractSpecification) => number;
  formatPrice: (price: number, contractSpec: ContractSpecification) => string;
}

// Market validation rules
export interface MarketValidation {
  validatePrice: (price: number, contractSpec: ContractSpecification) => boolean;
  validateQuantity: (quantity: number, contractSpec: ContractSpecification) => boolean;
  validateRiskParameters: (stopLoss: number, takeProfit: number, entryPrice: number, contractSpec: ContractSpecification) => string[];
}

// Export default market configurations
export const DEFAULT_MARKET_CONFIG = ES_FUTURES;

// Market selection helper types
export interface MarketSelection {
  contractSpec: ContractSpecification;
  isActive: boolean;
  lastUsed?: string;
}

export interface MarketPreferences {
  preferredMarkets: string[];            // Contract IDs
  defaultMarket: string;                 // Default contract ID
  quickAccessMarkets: string[];          // Quick access contract IDs
  marketSettings: Record<string, Partial<MarketSettings>>;  // Market-specific overrides
}