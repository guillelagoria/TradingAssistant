// Symbol configuration for futures trading
export interface SymbolConfig {
  symbol: string;
  name: string;
  pointValue: number;  // Dollar value per point
  tickSize: number;    // Minimum price increment
  exchange: string;
}

// Standard futures symbol configurations
export const SYMBOL_CONFIGS: Record<string, SymbolConfig> = {
  ES: {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    pointValue: 50,    // $50 per point
    tickSize: 0.25,    // 0.25 points minimum
    exchange: 'CME'
  },
  NQ: {
    symbol: 'NQ',
    name: 'E-mini NASDAQ-100',
    pointValue: 20,    // $20 per point
    tickSize: 0.25,    // 0.25 points minimum
    exchange: 'CME'
  }
};

/**
 * Get symbol configuration
 */
export function getSymbolConfig(symbol: string): SymbolConfig | null {
  return SYMBOL_CONFIGS[symbol.toUpperCase()] || null;
}

/**
 * Convert points to dollar value for a symbol
 */
export function convertPointsToDollars(symbol: string, points: number, quantity: number = 1): number {
  const config = getSymbolConfig(symbol);
  if (!config) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  return points * config.pointValue * quantity;
}

/**
 * Convert dollar value to points for a symbol
 */
export function convertDollarsToPoints(symbol: string, dollars: number, quantity: number = 1): number {
  const config = getSymbolConfig(symbol);
  if (!config) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  return dollars / (config.pointValue * quantity);
}

/**
 * Get all available symbols
 */
export function getAvailableSymbols(): SymbolConfig[] {
  return Object.values(SYMBOL_CONFIGS);
}

/**
 * Format dollar amount with proper currency formatting
 */
export function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format points with sign and proper decimal places
 */
export function formatPoints(points: number): string {
  const sign = points >= 0 ? '+' : '';
  return `${sign}${points.toFixed(2)} pts`;
}