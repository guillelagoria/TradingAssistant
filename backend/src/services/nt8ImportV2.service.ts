import { PrismaClient } from '@prisma/client';
import { parseNT8CSV } from '../utils/csvParser';
import { parseEuropeanNumber } from '../utils/numberParser';
import { parseNT8DateTime } from '../utils/dateParser';
import { calculateCommission } from '../config/commissions';
import {
  ParsedTrade,
  ValidationResult,
  ValidationError,
  TradePreview,
  ImportPreview,
  ImportResult
} from '../types/nt8ImportV2.types';

const prisma = new PrismaClient();

export class NT8ImportServiceV2 {
  /**
   * Preview import without saving to database
   */
  async previewImport(
    fileContent: string,
    userId: string,
    accountId: string
  ): Promise<ImportPreview> {
    const csvRows = parseNT8CSV(fileContent);
    const trades: TradePreview[] = [];
    let valid = 0;
    let duplicates = 0;
    let errors = 0;

    for (let i = 0; i < csvRows.length; i++) {
      const parsedTrade = this.parseRow(csvRows[i]);
      const validation = await this.validateTrade(parsedTrade, userId, accountId);

      if (validation.isValid && !validation.isDuplicate) {
        valid++;
      } else if (validation.isDuplicate) {
        duplicates++;
      } else {
        errors++;
      }

      trades.push({
        trade: parsedTrade,
        validation,
        rowNumber: i + 2 // +2 because CSV row 1 is header, arrays are 0-indexed
      });
    }

    return {
      total: csvRows.length,
      valid,
      duplicates,
      errors,
      trades
    };
  }

  /**
   * Execute import - saves valid, non-duplicate trades to database
   */
  async executeImport(
    fileContent: string,
    userId: string,
    accountId: string
  ): Promise<ImportResult> {
    const preview = await this.previewImport(fileContent, userId, accountId);
    const trades: TradePreview[] = [];
    let imported = 0;

    for (const tradePreview of preview.trades) {
      if (tradePreview.validation.isValid &&
          !tradePreview.validation.isDuplicate &&
          tradePreview.trade) {
        try {
          // Calculate netPnl = pnl - commission
          const netPnl = tradePreview.trade.pnl - tradePreview.trade.commission;

          // Determine result (WIN/LOSS) based on netPnl
          const result = netPnl > 0 ? 'WIN' : netPnl < 0 ? 'LOSS' : 'BREAKEVEN';

          await prisma.trade.create({
            data: {
              userId,
              accountId,
              symbol: tradePreview.trade.symbol,
              direction: tradePreview.trade.direction,
              orderType: tradePreview.trade.orderType,
              quantity: tradePreview.trade.quantity,
              entryPrice: tradePreview.trade.entryPrice,
              exitPrice: tradePreview.trade.exitPrice,
              entryDate: tradePreview.trade.entryDate,
              exitDate: tradePreview.trade.exitDate,
              pnl: tradePreview.trade.pnl,
              netPnl: netPnl,
              result: result,
              commission: tradePreview.trade.commission,
              mae: tradePreview.trade.mae,
              mfe: tradePreview.trade.mfe,
              maxAdversePrice: tradePreview.trade.mae,
              maxFavorablePrice: tradePreview.trade.mfe,
              nt8Strategy: tradePreview.trade.nt8Strategy,
              nt8Account: tradePreview.trade.nt8Account,
              exitName: tradePreview.trade.exitName,
              source: tradePreview.trade.source
            }
          });
          imported++;
        } catch (error) {
          console.error(`Failed to import trade row ${tradePreview.rowNumber}:`, error);
        }
      }
      trades.push(tradePreview);
    }

    return {
      total: preview.total,
      imported,
      duplicates: preview.duplicates,
      errors: preview.errors,
      trades
    };
  }

  /**
   * Parse a single CSV row into a ParsedTrade object
   */
  private parseRow(csvRow: any): ParsedTrade | null {
    try {
      console.log('[NT8 Parse] Raw row:', csvRow);

      const entryDate = parseNT8DateTime(csvRow['Entry time']);
      const exitDate = parseNT8DateTime(csvRow['Exit time']);

      if (!entryDate) {
        console.error('[NT8 Parse] No entry date found');
        return null;
      }

      // Parse commission from CSV, or calculate based on instrument if 0
      const csvCommission = parseEuropeanNumber(csvRow['Commission']);
      const quantity = parseEuropeanNumber(csvRow['Qty']);
      const instrument = csvRow['Instrument'] || '';
      const symbol = this.extractSymbol(instrument);

      // If CSV commission is 0, calculate based on symbol and quantity
      const commission = csvCommission > 0
        ? csvCommission
        : calculateCommission(symbol, quantity);

      console.log('[NT8 Commission]', {
        symbol,
        quantity,
        csvCommission,
        calculatedCommission: commission
      });

      const parsed = {
        symbol,
        direction: this.parseDirection(csvRow['Market pos.'] || ''),
        quantity,
        entryPrice: parseEuropeanNumber(csvRow['Entry price']),
        exitPrice: parseEuropeanNumber(csvRow['Exit price']) || null,
        entryDate,
        exitDate,
        pnl: parseEuropeanNumber(csvRow['Profit']),
        commission,
        mae: parseEuropeanNumber(csvRow['MAE']),
        mfe: parseEuropeanNumber(csvRow['MFE']),
        nt8Strategy: csvRow['Strategy'] || null,
        nt8Account: csvRow['Account'] || null,
        nt8TradeNumber: parseInt(csvRow['Trade number'] || '0', 10) || 0,
        exitName: csvRow['Exit name'] || null,
        source: 'NT8_IMPORT',
        orderType: 'MARKET'
      };

      console.log('[NT8 Parse] Parsed trade:', {
        symbol: parsed.symbol,
        pnl: parsed.pnl,
        mae: parsed.mae,
        mfe: parsed.mfe,
        commission: parsed.commission
      });

      return parsed;
    } catch (error) {
      console.error('Error parsing row:', error);
      return null;
    }
  }

  /**
   * Validate a parsed trade and check for duplicates
   */
  private async validateTrade(
    trade: ParsedTrade | null,
    userId: string,
    accountId: string
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!trade) {
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Failed to parse trade data' }],
        isDuplicate: false
      };
    }

    // Required field validations
    if (!trade.symbol) {
      errors.push({ field: 'symbol', message: 'Symbol is required' });
    }
    if (!trade.direction) {
      errors.push({ field: 'direction', message: 'Direction is required' });
    }
    if (trade.quantity <= 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
    }
    if (trade.entryPrice <= 0) {
      errors.push({ field: 'entryPrice', message: 'Entry price must be greater than 0' });
    }
    if (!trade.entryDate) {
      errors.push({ field: 'entryDate', message: 'Entry date is required' });
    }

    // Check for duplicates if validation passes
    let isDuplicate = false;
    if (errors.length === 0) {
      const existing = await prisma.trade.findFirst({
        where: {
          userId,
          accountId,
          symbol: trade.symbol,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          quantity: trade.quantity,
          entryDate: trade.entryDate
        }
      });
      isDuplicate = !!existing;
    }

    return {
      isValid: errors.length === 0,
      errors,
      isDuplicate
    };
  }

  /**
   * Extract symbol from instrument string
   * Example: "ES SEP25" → "ES"
   */
  private extractSymbol(instrument: string): string {
    if (!instrument) return '';
    const parts = instrument.trim().split(' ');
    return parts[0] || '';
  }

  /**
   * Parse direction string to enum
   * "Long" → "LONG", "Short" → "SHORT"
   */
  private parseDirection(marketPos: string): 'LONG' | 'SHORT' {
    const pos = marketPos.trim().toUpperCase();
    return pos === 'LONG' ? 'LONG' : 'SHORT';
  }
}