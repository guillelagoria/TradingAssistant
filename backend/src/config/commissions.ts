/**
 * Commission rates by instrument symbol
 * Standard commissions for futures trading
 */

export interface CommissionRate {
  symbol: string;
  displayName: string;
  commission: number; // Per contract, round trip (entry + exit)
  description: string;
}

export const COMMISSION_RATES: Record<string, CommissionRate> = {
  // E-mini S&P 500
  'ES': {
    symbol: 'ES',
    displayName: 'E-mini S&P 500',
    commission: 4.20, // Typical broker commission per contract round trip
    description: 'E-mini S&P 500 futures'
  },
  'MES': {
    symbol: 'MES',
    displayName: 'Micro E-mini S&P 500',
    commission: 1.20,
    description: 'Micro E-mini S&P 500 futures (1/10th size of ES)'
  },

  // E-mini NASDAQ-100
  'NQ': {
    symbol: 'NQ',
    displayName: 'E-mini NASDAQ-100',
    commission: 4.20,
    description: 'E-mini NASDAQ-100 futures'
  },
  'MNQ': {
    symbol: 'MNQ',
    displayName: 'Micro E-mini NASDAQ-100',
    commission: 1.20,
    description: 'Micro E-mini NASDAQ-100 futures (1/10th size of NQ)'
  },

  // E-mini Dow
  'YM': {
    symbol: 'YM',
    displayName: 'E-mini Dow',
    commission: 4.20,
    description: 'E-mini Dow Jones Industrial Average futures'
  },
  'MYM': {
    symbol: 'MYM',
    displayName: 'Micro E-mini Dow',
    commission: 1.20,
    description: 'Micro E-mini Dow futures (1/10th size of YM)'
  },

  // E-mini Russell 2000
  'RTY': {
    symbol: 'RTY',
    displayName: 'E-mini Russell 2000',
    commission: 4.20,
    description: 'E-mini Russell 2000 futures'
  },
  'M2K': {
    symbol: 'M2K',
    displayName: 'Micro E-mini Russell 2000',
    commission: 1.20,
    description: 'Micro E-mini Russell 2000 futures (1/10th size of RTY)'
  },

  // Crude Oil
  'CL': {
    symbol: 'CL',
    displayName: 'Crude Oil',
    commission: 4.20,
    description: 'Crude Oil futures (WTI)'
  },
  'MCL': {
    symbol: 'MCL',
    displayName: 'Micro Crude Oil',
    commission: 1.20,
    description: 'Micro Crude Oil futures (1/10th size of CL)'
  },

  // Gold
  'GC': {
    symbol: 'GC',
    displayName: 'Gold',
    commission: 4.20,
    description: 'Gold futures (100 troy ounces)'
  },
  'MGC': {
    symbol: 'MGC',
    displayName: 'Micro Gold',
    commission: 1.20,
    description: 'Micro Gold futures (10 troy ounces)'
  }
};

/**
 * Get commission rate for a symbol
 * Extracts base symbol (e.g., "ES 12-24" -> "ES")
 */
export function getCommissionForSymbol(symbol: string): number {
  // Extract base symbol (remove month/year codes and contract details)
  const baseSymbol = extractBaseSymbol(symbol);

  const commissionRate = COMMISSION_RATES[baseSymbol];
  if (commissionRate) {
    return commissionRate.commission;
  }

  // Default commission if symbol not found
  console.warn(`[Commission] No commission rate found for symbol: ${symbol}, using default $4.20`);
  return 4.20;
}

/**
 * Extract base symbol from full symbol string
 * Examples:
 *  - "ES 12-24" -> "ES"
 *  - "NQ 03-25" -> "NQ"
 *  - "MES 06-24" -> "MES"
 */
export function extractBaseSymbol(symbol: string): string {
  // Remove whitespace and split by space
  const parts = symbol.trim().split(/\s+/);

  // Return first part (base symbol)
  return parts[0].toUpperCase();
}

/**
 * Calculate total commission for a trade
 * For round trip (entry + exit already included in rate)
 */
export function calculateCommission(symbol: string, quantity: number): number {
  const ratePerContract = getCommissionForSymbol(symbol);
  return ratePerContract * quantity;
}
