/**
 * Types for NinjaTrader 8 CSV Import V2
 * Simple, robust types for parsing and importing trades
 */

export interface ParsedTrade {
  // Core trade data
  symbol: string;
  direction: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  entryDate: Date;
  exitDate: Date | null;

  // Financial data
  pnl: number;
  commission: number;
  mae: number;
  mfe: number;

  // NT8 specific data
  nt8Strategy: string | null;
  nt8Account: string | null;
  nt8TradeNumber: number;
  exitName: string | null;

  // Metadata
  source: 'NT8_IMPORT';
  orderType: 'MARKET';
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  isDuplicate: boolean;
}

export interface TradePreview {
  trade: ParsedTrade | null;
  validation: ValidationResult;
  rowNumber: number;
}

export interface ImportPreview {
  total: number;
  valid: number;
  duplicates: number;
  errors: number;
  trades: TradePreview[];
}

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  trades: TradePreview[];
}