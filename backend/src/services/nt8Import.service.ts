/**
 * NinjaTrader 8 Import Service
 * Handles parsing and importing of NT8 trade exports (CSV/Excel)
 */

import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';
import { PrismaClient, Trade, ImportSession, ImportStatus, ImportSource, TradeSource, OrderType, TradeDirection } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  NT8RawTrade,
  NT8ParsedTrade,
  NT8ValidationResult,
  NT8FileFormat,
  NT8FieldMapping,
  DEFAULT_NT8_FIELD_MAPPINGS,
  NT8ImportOptions,
  parseInstrumentSymbol,
  parseDirection,
  parseEuropeanNumber,
  parseNT8Date
} from '../types/nt8.types';
import {
  ImportTradeResult,
  BatchImportResult
} from '../types/import.types';

export class NT8ImportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Main import method - orchestrates the entire import process
   */
  async importNT8File(
    filePath: string,
    options: NT8ImportOptions
  ): Promise<BatchImportResult> {
    const startTime = Date.now();
    let session: ImportSession | null = null;

    try {
      // Prevent concurrent imports using database transaction
      await this.prisma.$transaction(async (tx) => {
        const activeImport = await tx.importSession.findFirst({
          where: {
            userId: options.userId,
            OR: [
              {
                status: {
                  in: [ImportStatus.PENDING, ImportStatus.PROCESSING]
                }
              },
              {
                AND: [
                  {
                    status: {
                      notIn: ['FAILED', 'COMPLETED']
                    }
                  },
                  {
                    startedAt: {
                      gte: new Date(Date.now() - 120000) // Last 2 minutes
                    }
                  }
                ]
              }
            ]
          },
          orderBy: { startedAt: 'desc' }
        });

        if (activeImport) {
          throw new Error(`Import already in progress (session: ${activeImport.id}). Please wait for the current import to complete.`);
        }
      });
      // Detect file format
      const format = this.detectFileFormat(filePath);
      const fileStats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      // Create import session
      session = await this.createImportSession({
        userId: options.userId,
        source: format === NT8FileFormat.CSV ? ImportSource.NT8_CSV : ImportSource.NT8_EXCEL,
        fileName,
        filePath,
        fileSize: fileStats.size
      });

      // Parse the file
      const rawTrades = await this.parseFile(filePath, format);

      // Update session with total rows
      await this.updateImportSession(session.id, {
        totalRows: rawTrades.length,
        status: ImportStatus.PROCESSING
      });

      // Process trades
      const result = await this.processTrades(
        rawTrades,
        session.id,
        options
      );

      // Update session with final status
      await this.updateImportSession(session.id, {
        status: result.status,
        processedRows: result.summary.total,
        importedRows: result.summary.imported,
        skippedRows: result.summary.skipped,
        errorRows: result.summary.errors,
        duplicateRows: result.summary.duplicates,
        errors: result.errors,
        warnings: result.warnings,
        completedAt: new Date()
      });

      return {
        sessionId: session.id,
        status: result.status,
        summary: result.summary,
        trades: result.trades,
        errors: result.errors,
        warnings: result.warnings,
        duration: Date.now() - startTime
      };

    } catch (error) {
      // Update session with error status
      if (session) {
        await this.updateImportSession(session.id, {
          status: ImportStatus.FAILED,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          completedAt: new Date()
        });
      }
      throw error;
    }
  }

  /**
   * Parse file based on format (CSV or Excel)
   */
  private async parseFile(
    filePath: string,
    format: NT8FileFormat
  ): Promise<NT8RawTrade[]> {
    if (format === NT8FileFormat.CSV) {
      return this.parseCSV(filePath);
    } else {
      return this.parseExcel(filePath);
    }
  }

  /**
   * Parse CSV file with semicolon delimiter (NT8 format)
   */
  private async parseCSV(filePath: string): Promise<NT8RawTrade[]> {
    return new Promise((resolve, reject) => {
      const trades: NT8RawTrade[] = [];
      const fileContent = fs.readFile(filePath, 'utf-8');

      fileContent
        .then(content => {
          const parser = parse({
            columns: true,
            delimiter: ';', // NT8 uses semicolon delimiter
            skip_empty_lines: true,
            trim: true,
            cast: false, // Disable auto-casting to handle European format manually
            cast_date: false
          });

          parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
              trades.push(record as NT8RawTrade);
            }
          });

          parser.on('error', (err) => {
            reject(err);
          });

          parser.on('end', () => {
            resolve(trades);
          });

          parser.write(content);
          parser.end();
        })
        .catch(reject);
    });
  }

  /**
   * Parse Excel file (XLSX/XLS)
   */
  private async parseExcel(filePath: string): Promise<NT8RawTrade[]> {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd hh:mm:ss'
    });

    return jsonData as NT8RawTrade[];
  }

  /**
   * Process trades - validate, transform, and import
   */
  private async processTrades(
    rawTrades: NT8RawTrade[],
    sessionId: string,
    options: NT8ImportOptions
  ): Promise<{
    status: ImportStatus;
    summary: {
      total: number;
      imported: number;
      skipped: number;
      errors: number;
      duplicates: number;
    };
    trades: ImportTradeResult[];
    errors: string[];
    warnings: string[];
  }> {
    const results: ImportTradeResult[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const summary = {
      total: rawTrades.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0
    };

    // Get user's active account
    const user = await this.prisma.user.findUnique({
      where: { id: options.userId },
      include: {
        accounts: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    if (!user || user.accounts.length === 0) {
      throw new Error('No active account found for user');
    }

    const accountId = user.accounts[0].id;
    const fieldMapping = { ...DEFAULT_NT8_FIELD_MAPPINGS, ...(options.fieldMapping || {}) };


    // Pre-create strategies to avoid race conditions
    const strategyNames = new Set<string>();
    rawTrades.forEach(trade => {
      const strategy = this.getFieldValue(trade, fieldMapping.strategy);
      if (strategy) {
        strategyNames.add(String(strategy));
      }
    });

    const strategyMap = new Map<string, string>();
    for (const strategyName of strategyNames) {
      try {
        let strategy = await this.prisma.strategy.findFirst({
          where: {
            userId: options.userId,
            name: strategyName
          }
        });

        if (!strategy) {
          strategy = await this.prisma.strategy.create({
            data: {
              userId: options.userId,
              name: strategyName,
              description: `Imported from NT8`
            }
          });
        }

        strategyMap.set(strategyName, strategy.id);
      } catch (error) {
        // If strategy already exists due to concurrent creation, find it
        const existingStrategy = await this.prisma.strategy.findFirst({
          where: {
            userId: options.userId,
            name: strategyName
          }
        });
        if (existingStrategy) {
          strategyMap.set(strategyName, existingStrategy.id);
        }
      }
    }

    // Process trades in batches
    const batchSize = 100;
    for (let i = 0; i < rawTrades.length; i += batchSize) {
      const batch = rawTrades.slice(i, Math.min(i + batchSize, rawTrades.length));

      await Promise.all(batch.map(async (rawTrade, index) => {
        const rowNumber = i + index + 1;

        try {
          // Parse and validate trade
          const parsedTrade = this.parseNT8Trade(rawTrade, fieldMapping);
          const validation = this.validateTrade(parsedTrade);

          if (!validation.isValid) {
            results.push({
              rowNumber,
              success: false,
              errors: validation.errors
            });
            errors.push(`Row ${rowNumber}: ${validation.errors.join(', ')}`);
            summary.errors++;
            return;
          }

          // Check for duplicates
          let isDuplicate = false;
          if (options.skipDuplicates) {
            isDuplicate = await this.checkDuplicate(
              parsedTrade,
              options.userId,
              accountId
            );
          }

          // Import trade (unless dry run)
          if (!options.dryRun) {
            if (isDuplicate) {
              results.push({
                rowNumber,
                success: false,
                duplicate: true,
                warnings: ['Trade already exists']
              });
              warnings.push(`Row ${rowNumber}: Duplicate trade skipped`);
              summary.duplicates++;
              summary.skipped++;
              return;
            }

            console.log('💾 [importNT8File] Creating trade:', parsedTrade.symbol, parsedTrade.entryPrice, 'for row', rowNumber);

            try {
              const trade = await this.createTrade(
                parsedTrade,
                options.userId,
                accountId,
                sessionId,
                options.defaultCommission || user.commission || 0,
                strategyMap
              );
              console.log('💾 [importNT8File] Trade created with ID:', trade.id);

              results.push({
                rowNumber,
                success: true,
                tradeId: trade.id
              });
              summary.imported++;
              console.log('💾 [importNT8File] Summary so far - imported:', summary.imported, 'of', summary.total);

            } catch (createError: any) {
              // Handle unique constraint violation (duplicate trade at DB level)
              if (createError.code === 'P2002' || createError.message?.includes('unique constraint')) {
                console.log('💾 [importNT8File] ⚠️ Database-level duplicate detected for row', rowNumber);
                results.push({
                  rowNumber,
                  success: false,
                  duplicate: true,
                  warnings: ['Trade blocked by database unique constraint (likely duplicate)']
                });
                warnings.push(`Row ${rowNumber}: Duplicate trade blocked by database constraint`);
                summary.duplicates++;
                summary.skipped++;
              } else {
                // Re-throw other errors
                throw createError;
              }
            }
          } else {
            // For dry runs, include the parsed trade data for preview
            // Mark duplicates appropriately but still show them in preview
            const warningList = ['Dry run - trade not imported'];
            if (isDuplicate) {
              warningList.push('Trade already exists - will be skipped');
              summary.duplicates++;
            }

            results.push({
              rowNumber,
              success: true,
              duplicate: isDuplicate,
              warnings: warningList,
              trade: {
                instrument: parsedTrade.symbol,
                quantity: parsedTrade.quantity,
                price: parsedTrade.entryPrice,
                time: parsedTrade.entryDate.toISOString(),
                direction: parsedTrade.direction,
                commission: parsedTrade.commission,
                pnl: parsedTrade.pnl,
                exitPrice: parsedTrade.exitPrice,
                exitTime: parsedTrade.exitDate?.toISOString() || null,
                mae: parsedTrade.mae,
                mfe: parsedTrade.mfe,
                strategy: parsedTrade.strategy,
                account: parsedTrade.account,
                tradeId: parsedTrade.tradeId,
                notes: parsedTrade.notes,
                error: isDuplicate ? 'Duplicate trade' : undefined
              }
            });
            summary.skipped++;
          }

          if (validation.warnings.length > 0) {
            warnings.push(`Row ${rowNumber}: ${validation.warnings.join(', ')}`);
          }

        } catch (error) {
          results.push({
            rowNumber,
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          summary.errors++;
        }
      }));

      // Update session progress
      await this.updateImportSession(sessionId, {
        processedRows: Math.min(i + batchSize, rawTrades.length)
      });
    }

    // Determine final status
    let status: ImportStatus;
    if (options.dryRun) {
      // For dry runs (preview), consider it successful if we processed trades without errors
      status = summary.errors === 0 ? ImportStatus.COMPLETED : ImportStatus.FAILED;
    } else if (summary.imported === summary.total) {
      status = ImportStatus.COMPLETED;
    } else if (summary.imported === 0) {
      status = ImportStatus.FAILED;
    } else {
      status = ImportStatus.PARTIAL;
    }

    return {
      status,
      summary,
      trades: results,
      errors,
      warnings
    };
  }

  /**
   * Helper function to get field value from raw trade
   */
  private getFieldValue(raw: NT8RawTrade, fieldNames: string[]): any {
    for (const fieldName of fieldNames) {
      const value = (raw as any)[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
    return null;
  }

  /**
   * Parse NT8 raw trade to normalized format
   */
  private parseNT8Trade(
    raw: NT8RawTrade,
    fieldMapping: NT8FieldMapping
  ): NT8ParsedTrade {
    // Debug: Log basic trade info
    console.log('🔍 [parseNT8Trade] Processing trade:', raw['Trade number'] || 'unknown', raw['Instrument'] || 'unknown');

    // Helper function to get field value
    const getFieldValue = (fieldNames: string[]): any => {
      for (const fieldName of fieldNames) {
        const value = (raw as any)[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
      return null;
    };

    // Parse dates using NT8 format
    const parseDate = (value: any): Date | null => {
      if (!value) return null;
      // Try NT8 date format first
      const nt8Date = parseNT8Date(String(value));
      if (nt8Date) return nt8Date;

      // Fallback to standard parsing
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    // Parse numbers using European format
    const parseNumber = (value: any): number | null => {
      return parseEuropeanNumber(value);
    };

    // Extract values
    const entryTime = getFieldValue(fieldMapping.entryTime);
    const exitTime = getFieldValue(fieldMapping.exitTime);
    const instrument = getFieldValue(fieldMapping.instrument);
    const quantity = getFieldValue(fieldMapping.quantity);
    const entryPrice = getFieldValue(fieldMapping.entryPrice);
    const exitPrice = getFieldValue(fieldMapping.exitPrice);
    const directionRaw = getFieldValue(fieldMapping.direction);
    const pnl = getFieldValue(fieldMapping.pnl);
    const commission = getFieldValue(fieldMapping.commission);
    const mae = getFieldValue(fieldMapping.mae);
    const mfe = getFieldValue(fieldMapping.mfe);
    const strategy = getFieldValue(fieldMapping.strategy);
    const account = getFieldValue(fieldMapping.account);
    const tradeId = getFieldValue(fieldMapping.tradeId);
    const notes = getFieldValue(fieldMapping.notes);

    // Parse values
    const entryDate = parseDate(entryTime);
    const exitDate = parseDate(exitTime);

    if (!entryDate) {
      throw new Error('Entry date is required');
    }

    const symbol = parseInstrumentSymbol(instrument || '');
    const direction = parseDirection(directionRaw);

    if (!direction) {
      throw new Error('Unable to determine trade direction');
    }

    // Calculate duration if both dates exist
    let duration: number | null = null;
    if (entryDate && exitDate) {
      duration = Math.round((exitDate.getTime() - entryDate.getTime()) / 60000); // in minutes
    }

    return {
      symbol,
      direction,
      entryPrice: parseNumber(entryPrice) || 0,
      exitPrice: parseNumber(exitPrice),
      quantity: Math.abs(parseNumber(quantity) || 0),
      entryDate,
      exitDate,
      pnl: parseNumber(pnl),
      commission: Math.abs(parseNumber(commission) || 0),
      mae: Math.abs(parseNumber(mae) || 0), // MAE should be positive
      mfe: Math.abs(parseNumber(mfe) || 0), // MFE should be positive
      strategy: strategy ? String(strategy).trim() : null,
      account: account ? String(account).trim() : null,
      tradeId: tradeId ? String(tradeId).trim() : null,
      exitReason: notes ? String(notes).trim() : null,
      duration,
      notes: notes ? String(notes).trim() : null
    };
  }

  /**
   * Validate parsed trade
   */
  private validateTrade(trade: NT8ParsedTrade): NT8ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!trade.symbol) {
      errors.push('Symbol is required');
    }
    if (!trade.direction) {
      errors.push('Direction is required');
    }
    if (trade.entryPrice <= 0) {
      errors.push('Entry price must be positive');
    }
    if (trade.quantity <= 0) {
      errors.push('Quantity must be positive');
    }
    if (!trade.entryDate) {
      errors.push('Entry date is required');
    }

    // Logical validations
    if (trade.exitDate && trade.entryDate && trade.exitDate < trade.entryDate) {
      errors.push('Exit date cannot be before entry date');
    }
    if (trade.exitPrice !== null && trade.exitPrice <= 0) {
      errors.push('Exit price must be positive');
    }

    // Warnings
    if (!trade.exitDate || !trade.exitPrice) {
      warnings.push('Trade is still open (no exit date/price)');
    }
    if (!trade.strategy) {
      warnings.push('No strategy specified');
    }
    if (trade.commission === 0) {
      warnings.push('No commission specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      parsedTrade: errors.length === 0 ? trade : null
    };
  }

  /**
   * Check if trade is duplicate
   */
  private async checkDuplicate(
    trade: NT8ParsedTrade,
    userId: string,
    accountId: string
  ): Promise<boolean> {
    // Check for duplicate trades with enhanced criteria:
    // - Same symbol, direction, entry price, quantity
    // - Entry date within 5 minutes (for NT8 timing variations)
    // - Same user and account
    const existingTrade = await this.prisma.$queryRaw`
      SELECT id
      FROM trades
      WHERE "userId" = ${userId}
        AND "accountId" = ${accountId}
        AND symbol = ${trade.symbol}
        AND direction = ${trade.direction}
        AND "entryPrice" = ${trade.entryPrice}
        AND quantity = ${trade.quantity}
        AND "entryDate" BETWEEN ${new Date(trade.entryDate.getTime() - 300000)} AND ${new Date(trade.entryDate.getTime() + 300000)}
      LIMIT 1
    `;

    return (existingTrade as any[]).length > 0;
  }

  /**
   * Create trade in database
   */
  private async createTrade(
    parsedTrade: NT8ParsedTrade,
    userId: string,
    accountId: string,
    importSessionId: string,
    defaultCommission: number,
    strategyMap: Map<string, string>
  ): Promise<Trade> {
    // Calculate additional metrics
    const commission = parsedTrade.commission || defaultCommission;
    let pnl = parsedTrade.pnl;
    let netPnl = pnl;

    // If PnL not provided but exit price exists, calculate it
    if (pnl === null && parsedTrade.exitPrice) {
      const priceMove = parsedTrade.exitPrice - parsedTrade.entryPrice;
      const directionMultiplier = parsedTrade.direction === 'LONG' ? 1 : -1;
      pnl = priceMove * directionMultiplier * parsedTrade.quantity;
      netPnl = pnl - commission;
    }

    // Calculate efficiency if MAE/MFE are available
    let efficiency: number | null = null;
    if (parsedTrade.mfe && parsedTrade.mae && pnl !== null) {
      const potentialProfit = parsedTrade.direction === 'LONG'
        ? parsedTrade.mfe * parsedTrade.quantity
        : parsedTrade.mae * parsedTrade.quantity;

      if (potentialProfit > 0) {
        efficiency = (pnl / potentialProfit) * 100;
      }
    }

    // Determine trade result
    let result = null;
    if (netPnl !== null) {
      if (netPnl > 0) result = 'WIN';
      else if (netPnl < 0) result = 'LOSS';
      else result = 'BREAKEVEN';
    }

    // Get strategy ID from the pre-created map
    let strategyId: string | null = null;
    if (parsedTrade.strategy) {
      strategyId = strategyMap.get(parsedTrade.strategy) || null;
    }

    // Create trade
    return this.prisma.trade.create({
      data: {
        userId,
        accountId,
        importSessionId,
        strategyId,
        symbol: parsedTrade.symbol,
        market: parsedTrade.symbol, // Use symbol as market for now
        direction: parsedTrade.direction as TradeDirection,
        orderType: OrderType.MARKET, // Default to market order
        entryDate: parsedTrade.entryDate,
        entryPrice: parsedTrade.entryPrice,
        quantity: parsedTrade.quantity,
        exitDate: parsedTrade.exitDate,
        exitPrice: parsedTrade.exitPrice,
        maxFavorablePrice: parsedTrade.mfe,
        maxAdversePrice: parsedTrade.mae,
        notes: parsedTrade.notes,
        pnl,
        commission,
        netPnl,
        efficiency,
        result: result as any,
        source: TradeSource.NT8_IMPORT
      }
    });
  }

  /**
   * Create import session
   */
  private async createImportSession(data: {
    userId: string;
    source: ImportSource;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
  }): Promise<ImportSession> {
    return this.prisma.importSession.create({
      data: {
        userId: data.userId,
        source: data.source,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        status: ImportStatus.PENDING,
        startedAt: new Date()
      }
    });
  }

  /**
   * Update import session
   */
  private async updateImportSession(
    id: string,
    data: Partial<{
      status: ImportStatus;
      totalRows: number;
      processedRows: number;
      importedRows: number;
      skippedRows: number;
      errorRows: number;
      duplicateRows: number;
      errors: string[];
      warnings: string[];
      completedAt: Date;
    }>
  ): Promise<void> {
    await this.prisma.importSession.update({
      where: { id },
      data: {
        ...data,
        errors: data.errors ? JSON.stringify(data.errors) : undefined,
        warnings: data.warnings ? JSON.stringify(data.warnings) : undefined
      } as any
    });
  }

  /**
   * Detect file format from extension
   */
  private detectFileFormat(filePath: string): NT8FileFormat {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.csv':
        return NT8FileFormat.CSV;
      case '.xlsx':
        return NT8FileFormat.EXCEL;
      case '.xls':
        return NT8FileFormat.XLS;
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Get import session details
   */
  async getImportSession(sessionId: string, userId: string): Promise<ImportSession | null> {
    return this.prisma.importSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        trades: {
          select: {
            id: true,
            symbol: true,
            pnl: true,
            entryDate: true,
            exitDate: true
          }
        }
      }
    });
  }

  /**
   * Get user's import history
   */
  async getImportHistory(
    userId: string,
    limit: number = 10
  ): Promise<ImportSession[]> {
    return this.prisma.importSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { trades: true }
        }
      }
    });
  }

  /**
   * Delete import session and optionally its trades
   */
  async deleteImportSession(
    sessionId: string,
    userId: string,
    deleteTrades: boolean = false
  ): Promise<void> {
    const session = await this.prisma.importSession.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new Error('Import session not found');
    }

    if (deleteTrades) {
      // Delete all trades from this import session
      await this.prisma.trade.deleteMany({
        where: { importSessionId: sessionId }
      });
    }

    // Delete the import session
    await this.prisma.importSession.delete({
      where: { id: sessionId }
    });
  }
}