/**
 * NinjaTrader 8 Import Types
 * Types and interfaces for handling NT8 trade data imports
 */

/**
 * Raw NT8 trade data as it comes from CSV/Excel exports
 * Field names match common NT8 export formats
 */
export interface NT8RawTrade {
  // Time fields
  'Entry time'?: string;
  'Exit time'?: string;
  'Entry Time'?: string;
  'Exit Time'?: string;
  EntryTime?: string;
  ExitTime?: string;

  // Instrument/Symbol
  Instrument?: string;
  Symbol?: string;
  Market?: string;

  // Position
  Quantity?: number | string;
  'Position size'?: number | string;
  PositionSize?: number | string;
  Contracts?: number | string;

  // Prices
  'Entry price'?: number | string;
  'Exit price'?: number | string;
  'Entry Price'?: number | string;
  'Exit Price'?: number | string;
  EntryPrice?: number | string;
  ExitPrice?: number | string;

  // Direction/Side
  Direction?: string;
  Side?: string;
  'Market pos.'?: string;
  'Market position'?: string;
  MarketPosition?: string;

  // P&L
  'P&L'?: number | string;
  PnL?: number | string;
  'Profit'?: number | string;
  'Net profit'?: number | string;
  NetProfit?: number | string;
  'Gross P&L'?: number | string;
  GrossPnL?: number | string;

  // Commission
  Commission?: number | string;
  'Commissions'?: number | string;
  Fees?: number | string;

  // MAE/MFE (Max Adverse/Favorable Excursion)
  MAE?: number | string;
  MFE?: number | string;
  'Max adverse excursion'?: number | string;
  'Max favorable excursion'?: number | string;
  MaxAdverseExcursion?: number | string;
  MaxFavorableExcursion?: number | string;

  // Strategy/Account
  Strategy?: string;
  'Strategy name'?: string;
  StrategyName?: string;
  Account?: string;
  'Account name'?: string;
  AccountName?: string;

  // Additional fields
  'Trade #'?: string | number;
  TradeNumber?: string | number;
  TradeId?: string | number;
  Duration?: string;
  'Exit reason'?: string;
  ExitReason?: string;
  Notes?: string;
  Comment?: string;
}

/**
 * Normalized NT8 trade data after parsing and transformation
 */
export interface NT8ParsedTrade {
  // Core trade data
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryDate: Date;
  exitDate: Date | null;

  // P&L and metrics
  pnl: number | null;
  commission: number;
  mae: number | null;
  mfe: number | null;

  // Strategy and metadata
  strategy: string | null;
  account: string | null;
  tradeId: string | null;
  exitReason: string | null;
  duration: number | null; // in minutes
  notes: string | null;
}

/**
 * Import validation result
 */
export interface NT8ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedTrade: NT8ParsedTrade | null;
}

/**
 * Import summary statistics
 */
export interface NT8ImportSummary {
  totalRows: number;
  validTrades: number;
  invalidTrades: number;
  duplicates: number;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

/**
 * Supported file formats for NT8 imports
 */
export enum NT8FileFormat {
  CSV = 'csv',
  EXCEL = 'xlsx',
  XLS = 'xls'
}

/**
 * Field mapping configuration
 */
export interface NT8FieldMapping {
  entryTime: string[];
  exitTime: string[];
  instrument: string[];
  quantity: string[];
  entryPrice: string[];
  exitPrice: string[];
  direction: string[];
  pnl: string[];
  commission: string[];
  mae: string[];
  mfe: string[];
  strategy: string[];
  account: string[];
  tradeId: string[];
  notes: string[];
}

/**
 * Default field mappings for NT8 exports
 * Updated to match actual NT8 CSV format with semicolon delimiters
 */
export const DEFAULT_NT8_FIELD_MAPPINGS: NT8FieldMapping = {
  entryTime: ['Entry time', 'Entry Time', 'EntryTime', 'Entry Date/Time', 'Fill time'],
  exitTime: ['Exit time', 'Exit Time', 'ExitTime', 'Exit Date/Time', 'Close time'],
  instrument: ['Instrument', 'Symbol', 'Market', 'Contract'],
  quantity: ['Qty', 'Quantity', 'Position size', 'PositionSize', 'Contracts', 'Size'],
  entryPrice: ['Entry price', 'Entry Price', 'EntryPrice', 'Fill price', 'Avg fill price'],
  exitPrice: ['Exit price', 'Exit Price', 'ExitPrice', 'Close price', 'Avg close price'],
  direction: ['Side', 'Market pos.', 'Direction', 'Market position', 'MarketPosition', 'Position'],
  pnl: ['Realized P&L', 'Profit', 'P&L', 'PnL', 'Net profit', 'NetProfit', 'Gross P&L', 'GrossPnL'],
  commission: ['Commission', 'Commissions', 'Fees', 'Total fees'],
  mae: ['MAE', 'Max adverse excursion', 'MaxAdverseExcursion', 'Max Adverse Excursion'],
  mfe: ['MFE', 'Max favorable excursion', 'MaxFavorableExcursion', 'Max Favorable Excursion'],
  strategy: ['Strategy', 'Strategy name', 'StrategyName', 'System'],
  account: ['Account', 'Account name', 'AccountName'],
  tradeId: ['Trade number', 'Trade #', 'TradeNumber', 'TradeId', 'Trade ID', 'Id'],
  notes: ['Exit name', 'Notes', 'Comment', 'Comments', 'Exit reason', 'ExitReason']
};

/**
 * Instrument mapping for common futures contracts
 * Updated to handle NT8 format like "ES SEP25"
 */
export const INSTRUMENT_MAPPINGS: Record<string, string> = {
  'ES': 'ES',
  'NQ': 'NQ',
  'RTY': 'RTY',
  'YM': 'YM',
  'CL': 'CL',
  'GC': 'GC',
  'SI': 'SI',
  'ZB': 'ZB',
  'ZN': 'ZN',
  'ZF': 'ZF',
  'ZC': 'ZC',
  'ZS': 'ZS',
  'ZW': 'ZW',
  'NG': 'NG',
  '6E': '6E',
  '6J': '6J',
  '6B': '6B',
  // NT8 format variations
  'ES SEP25': 'ES',
  'ES DEC25': 'ES',
  'ES MAR26': 'ES',
  'ES JUN26': 'ES',
  'NQ SEP25': 'NQ',
  'NQ DEC25': 'NQ',
  'NQ MAR26': 'NQ',
  'NQ JUN26': 'NQ',
  // Legacy formats
  'ES 03-24': 'ES',
  'NQ 03-24': 'NQ',
  'ES 06-24': 'ES',
  'NQ 06-24': 'NQ',
  'ES 09-24': 'ES',
  'NQ 09-24': 'NQ',
  'ES 12-24': 'ES',
  'NQ 12-24': 'NQ',
  'ES 03-25': 'ES',
  'NQ 03-25': 'NQ',
};

/**
 * Parse instrument symbol from NT8 format
 * Handles formats like "ES SEP25", "NQ DEC25", "ES 03-24"
 */
export function parseInstrumentSymbol(rawSymbol: string): string {
  if (!rawSymbol) return '';

  // Remove any spaces and convert to uppercase
  const cleanSymbol = rawSymbol.trim().toUpperCase();

  // Check if it matches any known mapping exactly
  if (INSTRUMENT_MAPPINGS[cleanSymbol]) {
    return INSTRUMENT_MAPPINGS[cleanSymbol];
  }

  // Try to extract base symbol from NT8 format (e.g., "ES SEP25" -> "ES")
  const nt8Match = cleanSymbol.match(/^([A-Z0-9]+)\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}/);
  if (nt8Match && INSTRUMENT_MAPPINGS[nt8Match[1]]) {
    return INSTRUMENT_MAPPINGS[nt8Match[1]];
  }

  // Try to extract base symbol from legacy format (e.g., "ES 03-24" -> "ES")
  const legacyMatch = cleanSymbol.match(/^([A-Z0-9]+)\s+\d{2}-\d{2}/);
  if (legacyMatch && INSTRUMENT_MAPPINGS[legacyMatch[1]]) {
    return INSTRUMENT_MAPPINGS[legacyMatch[1]];
  }

  // Return the first part before any space or special character
  const baseSymbol = cleanSymbol.split(/[\s\-_]/)[0];
  return INSTRUMENT_MAPPINGS[baseSymbol] || baseSymbol;
}

/**
 * Parse direction/position from NT8 format
 * Handles "Long"/"Short" from Market pos. column
 */
export function parseDirection(rawDirection: string | undefined): 'LONG' | 'SHORT' | null {
  if (!rawDirection) return null;

  const direction = rawDirection.trim().toUpperCase();

  if (direction === 'LONG' || direction === 'BUY' || direction === '1') {
    return 'LONG';
  }

  if (direction === 'SHORT' || direction === 'SELL' || direction === '-1') {
    return 'SHORT';
  }

  return null;
}

/**
 * Parse European number format used in NT8 CSV
 * Handles formats like "6387,50", "-$ 200,00", "$ 175,00"
 */
export function parseEuropeanNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;

  let str = String(value).trim();

  // Remove currency symbols ($ and €)
  str = str.replace(/[$€]/g, '');

  // Remove any whitespace
  str = str.replace(/\s/g, '');

  // Handle negative sign
  const isNegative = str.startsWith('-');
  if (isNegative) {
    str = str.substring(1);
  }

  // Replace comma with dot for decimal separator
  str = str.replace(',', '.');

  // Parse as float
  const num = parseFloat(str);

  if (isNaN(num)) return null;

  return isNegative ? -num : num;
}

/**
 * Parse NT8 date format: Supports both d/M/yyyy H:mm:ss and M/d/yyyy H:mm:ss
 * Examples:
 *   - European: "2/9/2025 12:18:21" (day/month/year)
 *   - US: "09/20/2025 10:30:00" (month/day/year)
 */
export function parseNT8Date(dateStr: string): Date | null {
  if (!dateStr) return null;

  // NT8 format: d/M/yyyy H:mm:ss or M/d/yyyy H:mm:ss
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);

  if (!match) {
    // Try fallback parsing
    const fallbackDate = new Date(dateStr);
    return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  }

  const [, first, second, year, hour, minute, second_part] = match;

  // Heuristic: If first number > 12, it's day (European format)
  // Otherwise, assume US format (month/day/year)
  let date: Date;
  const firstNum = parseInt(first);
  const secondNum = parseInt(second);
  let parsedYear = parseInt(year);

  if (firstNum > 12) {
    // European format (day/month/year)
    date = new Date(
      parsedYear,
      secondNum - 1, // month (0-indexed)
      firstNum, // day
      parseInt(hour),
      parseInt(minute),
      parseInt(second_part)
    );
  } else if (secondNum > 12) {
    // US format (month/day/year) - second value is clearly a day
    date = new Date(
      parsedYear,
      firstNum - 1, // month (0-indexed)
      secondNum, // day
      parseInt(hour),
      parseInt(minute),
      parseInt(second_part)
    );
  } else {
    // Ambiguous - default to US format (MM/DD/YYYY) as it's more common in NT8
    date = new Date(
      parsedYear,
      firstNum - 1, // month (0-indexed)
      secondNum, // day
      parseInt(hour),
      parseInt(minute),
      parseInt(second_part)
    );
  }

  if (isNaN(date.getTime())) return null;

  // CRITICAL FIX: NinjaTrader exports futures trades with contract expiry year, not trade execution year
  // Example: Trading ES SEP25 in October 2024 shows dates as "10/15/2025" instead of "10/15/2024"
  // Solution: If the parsed date is in the future (more than 30 days from now), assume it was last year
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (date > thirtyDaysFromNow) {
    // Date is more than 30 days in the future - likely wrong year from NT8 futures contract
    console.log(`⚠️ [parseNT8Date] Future date detected: ${dateStr} -> ${date.toISOString()}. Adjusting to previous year.`);
    date.setFullYear(date.getFullYear() - 1);
    console.log(`✅ [parseNT8Date] Corrected date: ${date.toISOString()}`);
  }

  return date;
}

/**
 * Configuration options for NT8 import
 */
export interface NT8ImportOptions {
  userId: string;
  skipDuplicates?: boolean;
  dryRun?: boolean;
  fieldMapping?: Partial<NT8FieldMapping>;
  timezone?: string;
  defaultCommission?: number;
}