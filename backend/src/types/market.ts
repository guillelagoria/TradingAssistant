// Market configuration types for backend

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
  CME = 'CME',
  CBOT = 'CBOT',
  NYMEX = 'NYMEX',
  COMEX = 'COMEX',
  ICE = 'ICE',
  EUREX = 'EUREX',
  NASDAQ = 'NASDAQ',
  NYSE = 'NYSE',
}

// Position sizing methods
export enum PositionSizingMethod {
  FIXED = 'fixed',
  RISK_BASED = 'risk_based',
  PERCENTAGE = 'percentage',
  VOLATILITY = 'volatility',
}

// Trading session interface
export interface TradingSession {
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
}

// Trading hours interface
export interface TradingHours {
  timezone: string;
  sessions: TradingSession[];
  holidays?: string[];
}

// Commission structure
export interface CommissionStructure {
  type: 'per_contract' | 'per_share' | 'percentage';
  amount: number;
  minimum?: number;
  maximum?: number;
  exchange?: number;
  clearing?: number;
  nfa?: number;
  regulation?: number;
}

// Risk management defaults
export interface RiskDefaults {
  defaultStopLossPercent: number;
  defaultTakeProfitPercent: number;
  maxPositionSize: number;
  riskPerTradePercent: number;
  maxDailyRisk: number;
  defaultPositionSizing: PositionSizingMethod;
  accountSizeForCalculation?: number;
}

// Market-specific settings
export interface MarketSettings {
  showFullContractValue: boolean;
  priceFormat: string;
  includeFees: boolean;
  autoCalculateMargin: boolean;
  defaultChartTimeframe: string;
  preferredOrderTypes: string[];
  enableVolumeAlerts: boolean;
  enablePriceAlerts: boolean;
  enableSeasonality: boolean;
  enableCorrelation: boolean;
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
  contractSize: number;
  tickSize: number;
  tickValue: number;
  pointValue: number;
  minimumMove: number;

  // Trading specifications
  currency: string;
  quoteCurrency?: string;
  precision: number;

  // Margin requirements
  initialMargin: number;
  maintenanceMargin: number;
  dayTradingMargin?: number;

  // Trading hours
  tradingHours: TradingHours;

  // Commission structure
  defaultCommission: CommissionStructure;

  // Risk management defaults
  riskDefaults: RiskDefaults;

  // Market specific settings
  settings: MarketSettings;

  // Contract months (for futures)
  contractMonths?: string[];

  // Additional metadata
  isActive: boolean;
  lastTradingDay?: string;
  deliveryMethod?: 'cash' | 'physical';
  settlementType?: 'daily' | 'final';
}

// Market preset interface
export interface MarketPreset {
  id: string;
  name: string;
  description: string;
  contractSpecs: ContractSpecification[];
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Market preferences interface
export interface MarketPreferences {
  preferredMarkets: string[];
  defaultMarket: string;
  quickAccessMarkets: string[];
  marketSettings: Record<string, Partial<MarketSettings>>;
  accountSize: number;
  riskPerTrade: number;
  commissionOverrides?: Record<string, Partial<CommissionStructure>>;
}

// API request/response types
export interface UpdateMarketPreferencesRequest {
  preferredMarkets?: string[];
  defaultMarket?: string;
  quickAccessMarkets?: string[];
  marketSettings?: Record<string, Partial<MarketSettings>>;
  accountSize?: number;
  riskPerTrade?: number;
  commissionOverrides?: Record<string, Partial<CommissionStructure>>;
}

export interface MarketDefaultsResponse {
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

// Trade validation result
export interface TradeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Market calculation result
export interface MarketCalculationResult {
  grossPnL: number;
  commission: number;
  netPnL: number;
  rMultiple?: number;
  efficiency?: number;
  marginRequired?: number;
  contractValue?: number;
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

  contractSize: 1,
  tickSize: 0.25,
  tickValue: 12.5,
  pointValue: 50,
  minimumMove: 0.25,

  currency: 'USD',
  precision: 2,

  initialMargin: 13200,
  maintenanceMargin: 12000,
  dayTradingMargin: 6600,

  tradingHours: {
    timezone: 'America/Chicago',
    sessions: [
      {
        name: 'Regular',
        startTime: '08:30',
        endTime: '15:15',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      {
        name: 'Overnight',
        startTime: '17:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      }
    ],
  },

  defaultCommission: {
    type: 'per_contract',
    amount: 4.00,
    exchange: 1.02,
    clearing: 0.02,
    nfa: 0.02,
  },

  riskDefaults: {
    defaultStopLossPercent: 1.0,
    defaultTakeProfitPercent: 2.0,
    maxPositionSize: 10,
    riskPerTradePercent: 1.0,
    maxDailyRisk: 3.0,
    defaultPositionSizing: PositionSizingMethod.RISK_BASED,
    accountSizeForCalculation: 100000,
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

  contractSize: 1,
  tickSize: 0.25,
  tickValue: 5.00,
  pointValue: 20,
  minimumMove: 0.25,

  currency: 'USD',
  precision: 2,

  initialMargin: 19800,
  maintenanceMargin: 18000,
  dayTradingMargin: 9900,

  tradingHours: {
    timezone: 'America/Chicago',
    sessions: [
      {
        name: 'Regular',
        startTime: '08:30',
        endTime: '15:15',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      {
        name: 'Overnight',
        startTime: '17:00',
        endTime: '08:30',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      }
    ],
  },

  defaultCommission: {
    type: 'per_contract',
    amount: 4.00,
    exchange: 1.02,
    clearing: 0.02,
    nfa: 0.02,
  },

  riskDefaults: {
    defaultStopLossPercent: 1.2,
    defaultTakeProfitPercent: 2.4,
    maxPositionSize: 8,
    riskPerTradePercent: 1.5,
    maxDailyRisk: 4.0,
    defaultPositionSizing: PositionSizingMethod.RISK_BASED,
    accountSizeForCalculation: 100000,
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

// Available contracts
export const AVAILABLE_CONTRACTS: ContractSpecification[] = [
  ES_FUTURES,
  NQ_FUTURES,
];

// Default market preset
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

// Helper function to get market by ID
export function getMarketById(marketId: string): ContractSpecification | null {
  return AVAILABLE_CONTRACTS.find(contract => contract.id === marketId || contract.symbol === marketId) || null;
}

// Helper function to get market by symbol
export function getMarketBySymbol(symbol: string): ContractSpecification | null {
  return AVAILABLE_CONTRACTS.find(contract => contract.symbol === symbol) || null;
}

// Simplified market info interface for frontend consumption
export interface MarketInfo {
  id: string;
  symbol: string;
  name: string;
  category: MarketCategory;
  exchange: Exchange;

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

// Convert ContractSpecification to simplified MarketInfo
export function toMarketInfo(contract: ContractSpecification): MarketInfo {
  return {
    id: contract.id,
    symbol: contract.symbol,
    name: contract.name,
    category: contract.category,
    exchange: contract.exchange,

    tickSize: contract.tickSize,
    tickValue: contract.tickValue,
    pointValue: contract.pointValue,
    currency: contract.currency,
    precision: contract.precision,

    commission: contract.defaultCommission.amount,
    initialMargin: contract.initialMargin,
    dayTradingMargin: contract.dayTradingMargin,

    defaultStopLossPercent: contract.riskDefaults.defaultStopLossPercent,
    defaultTakeProfitPercent: contract.riskDefaults.defaultTakeProfitPercent,
    maxPositionSize: contract.riskDefaults.maxPositionSize,
    riskPercentage: contract.riskDefaults.riskPerTradePercent,

    isActive: contract.isActive,
  };
}

// Get all markets as simplified MarketInfo array
export function getAllMarketsInfo(): MarketInfo[] {
  return AVAILABLE_CONTRACTS.map(toMarketInfo);
}

// Get market info by identifier
export function getMarketInfo(identifier: string): MarketInfo | null {
  const contract = getMarketById(identifier) || getMarketBySymbol(identifier);
  return contract ? toMarketInfo(contract) : null;
}