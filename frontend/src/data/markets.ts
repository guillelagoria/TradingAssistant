import { MarketInfo } from '../types/trade';

/**
 * Simplified market configurations based on popular futures contracts
 * Derived from the comprehensive ContractSpecification system but simplified
 * for the new single-form trade interface
 */

export const MARKET_ES: MarketInfo = {
  symbol: 'ES',
  displayName: 'E-mini S&P 500',
  tickValue: 12.5,  // $12.50 per tick
  pointValue: 50,   // $50 per point
  tickSize: 0.25,   // 0.25 points minimum move
  commission: 4.06, // $4.06 round turn (including exchange fees)
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_NQ: MarketInfo = {
  symbol: 'NQ',
  displayName: 'E-mini NASDAQ 100',
  tickValue: 5.0,   // $5.00 per tick
  pointValue: 20,   // $20 per point
  tickSize: 0.25,   // 0.25 points minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_YM: MarketInfo = {
  symbol: 'YM',
  displayName: 'E-mini Dow Jones',
  tickValue: 5.0,   // $5.00 per tick
  pointValue: 5,    // $5 per point
  tickSize: 1.0,    // 1 point minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_RTY: MarketInfo = {
  symbol: 'RTY',
  displayName: 'E-mini Russell 2000',
  tickValue: 5.0,   // $5.00 per tick
  pointValue: 50,   // $50 per point
  tickSize: 0.1,    // 0.1 points minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_CL: MarketInfo = {
  symbol: 'CL',
  displayName: 'Crude Oil',
  tickValue: 10.0,  // $10.00 per tick
  pointValue: 1000, // $1000 per point
  tickSize: 0.01,   // $0.01 minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_GC: MarketInfo = {
  symbol: 'GC',
  displayName: 'Gold',
  tickValue: 10.0,  // $10.00 per tick
  pointValue: 100,  // $100 per point
  tickSize: 0.1,    // $0.10 minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

export const MARKET_SI: MarketInfo = {
  symbol: 'SI',
  displayName: 'Silver',
  tickValue: 25.0,  // $25.00 per tick
  pointValue: 5000, // $5000 per point
  tickSize: 0.005,  // $0.005 minimum move
  commission: 4.06, // $4.06 round turn
  currency: 'USD',
  marketHours: {
    open: '17:00',
    close: '16:00', // Next day
    timezone: 'America/Chicago'
  }
};

// Default market list for the application
export const AVAILABLE_MARKETS: MarketInfo[] = [
  MARKET_ES,
  MARKET_NQ,
  MARKET_YM,
  MARKET_RTY,
  MARKET_CL,
  MARKET_GC,
  MARKET_SI,
];

// Market categories for grouping
export const MARKET_CATEGORIES = {
  INDICES: [MARKET_ES, MARKET_NQ, MARKET_YM, MARKET_RTY],
  COMMODITIES: [MARKET_CL, MARKET_GC, MARKET_SI],
};

// Popular market shortcuts
export const POPULAR_MARKETS = [MARKET_ES, MARKET_NQ, MARKET_YM, MARKET_RTY];

/**
 * Get market info by symbol
 */
export function getMarketBySymbol(symbol: string): MarketInfo | undefined {
  return AVAILABLE_MARKETS.find(market => market.symbol === symbol);
}

/**
 * Validate if a price respects the market's tick size
 */
export function validatePriceIncrement(price: number, market: MarketInfo): boolean {
  if (!market.tickSize) return true;
  const remainder = price % market.tickSize;
  return Math.abs(remainder) < 0.0001 || Math.abs(remainder - market.tickSize) < 0.0001;
}

/**
 * Round price to the nearest valid tick
 */
export function roundToTick(price: number, market: MarketInfo): number {
  if (!market.tickSize) return price;
  return Math.round(price / market.tickSize) * market.tickSize;
}

/**
 * Format price according to market conventions
 */
export function formatPrice(price: number, market: MarketInfo): string {
  // Determine decimal places based on tick size
  let decimals = 2;
  if (market.tickSize >= 1) decimals = 0;
  else if (market.tickSize >= 0.1) decimals = 1;
  else if (market.tickSize >= 0.01) decimals = 2;
  else if (market.tickSize >= 0.001) decimals = 3;

  return price.toFixed(decimals);
}