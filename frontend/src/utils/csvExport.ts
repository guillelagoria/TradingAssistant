import { stringify } from 'csv-stringify/browser/esm/sync';
import { format } from 'date-fns';
import { Trade, TradeStats } from '../types/trade';
import {
  ExportOptions,
  ExportProgress,
  DEFAULT_EXPORT_COLUMNS,
  formatTradeValue,
  getColumnHeader,
  filterTrades,
  generateFileName,
  calculateExportStats,
  createProgressTracker,
  downloadFile,
  sleep
} from './exportHelpers';

export interface CsvExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
  stats?: TradeStats;
}

export class CsvExporter {
  private progressTracker = createProgressTracker();
  private cancelled = false;

  onProgress(callback: (progress: ExportProgress) => void) {
    this.progressTracker.onProgress(callback);
  }

  removeProgressListener(callback: (progress: ExportProgress) => void) {
    this.progressTracker.removeProgressListener(callback);
  }

  cancel() {
    this.cancelled = true;
  }

  async exportTrades(trades: Trade[], options: ExportOptions): Promise<CsvExportResult> {
    try {
      this.cancelled = false;
      
      // Stage 1: Preparing data
      this.progressTracker.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing trade data...'
      });
      
      await sleep(100); // Allow UI to update
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      const filteredTrades = filterTrades(trades, options);
      const columns = options.columns || DEFAULT_EXPORT_COLUMNS;
      
      // Stage 2: Processing trades
      this.progressTracker.updateProgress({
        stage: 'processing',
        progress: 30,
        message: `Processing ${filteredTrades.length} trades...`
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      // Prepare CSV data
      const csvData: string[][] = [];
      
      // Headers
      csvData.push(columns.map(getColumnHeader));
      
      // Process trades in batches for better performance
      const batchSize = 100;
      const batches = Math.ceil(filteredTrades.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        if (this.cancelled) throw new Error('Export cancelled');
        
        const start = i * batchSize;
        const end = Math.min(start + batchSize, filteredTrades.length);
        const batch = filteredTrades.slice(start, end);
        
        // Process batch
        batch.forEach(trade => {
          const row = columns.map(column => formatTradeValue(trade, column));
          csvData.push(row);
        });
        
        // Update progress
        const progress = 30 + (i + 1) / batches * 40;
        this.progressTracker.updateProgress({
          stage: 'processing',
          progress: Math.round(progress),
          message: `Processing batch ${i + 1}/${batches}...`
        });
        
        await sleep(10); // Allow UI updates
      }
      
      // Stage 3: Generating CSV
      this.progressTracker.updateProgress({
        stage: 'generating',
        progress: 80,
        message: 'Generating CSV file...'
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      const csvString = stringify(csvData, {
        quoted: true,
        quotedString: true,
        delimiter: ','
      });
      
      // Add statistics section if requested
      let finalCsvString = csvString;
      if (options.includeStats && filteredTrades.length > 0) {
        const stats = calculateExportStats(filteredTrades);
        finalCsvString += this.generateStatsSection(stats);
      }
      
      // Stage 4: Complete
      this.progressTracker.updateProgress({
        stage: 'generating',
        progress: 90,
        message: 'Preparing download...'
      });
      
      const blob = new Blob([finalCsvString], { type: 'text/csv;charset=utf-8;' });
      const fileName = generateFileName(options, 'trades');
      
      this.progressTracker.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!'
      });
      
      await sleep(100);
      
      // Download file
      downloadFile(blob, fileName);
      
      return {
        success: true,
        fileName,
        stats: options.includeStats ? calculateExportStats(filteredTrades) : undefined
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.progressTracker.updateProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async exportStats(stats: TradeStats, options: Omit<ExportOptions, 'columns'>): Promise<CsvExportResult> {
    try {
      this.cancelled = false;
      
      this.progressTracker.updateProgress({
        stage: 'preparing',
        progress: 20,
        message: 'Preparing statistics...'
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      this.progressTracker.updateProgress({
        stage: 'generating',
        progress: 60,
        message: 'Generating statistics CSV...'
      });
      
      const csvData = this.generateStatsCsvData(stats);
      
      this.progressTracker.updateProgress({
        stage: 'generating',
        progress: 80,
        message: 'Creating file...'
      });
      
      const csvString = stringify(csvData, {
        quoted: true,
        quotedString: true,
        delimiter: ','
      });
      
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const fileName = generateFileName({ ...options, format: 'csv' }, 'report');
      
      this.progressTracker.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!'
      });
      
      downloadFile(blob, fileName);
      
      return {
        success: true,
        fileName,
        stats
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.progressTracker.updateProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private generateStatsSection(stats: TradeStats): string {
    const statsData = [
      [''],
      ['TRADING STATISTICS'],
      [''],
      ['Metric', 'Value'],
      ['Total Trades', stats.totalTrades.toString()],
      ['Win Trades', stats.winTrades.toString()],
      ['Loss Trades', stats.lossTrades.toString()],
      ['Breakeven Trades', stats.breakevenTrades.toString()],
      ['Win Rate', `${stats.winRate.toFixed(2)}%`],
      ['Total P&L', `$${stats.totalPnl.toFixed(2)}`],
      ['Net P&L', `$${stats.netPnl.toFixed(2)}`],
      ['Average Win', `$${stats.avgWin.toFixed(2)}`],
      ['Average Loss', `$${stats.avgLoss.toFixed(2)}`],
      ['Profit Factor', stats.profitFactor.toFixed(2)],
      ['Max Win', `$${stats.maxWin.toFixed(2)}`],
      ['Max Loss', `$${stats.maxLoss.toFixed(2)}`],
      ['Average R Multiple', `${stats.avgRMultiple.toFixed(2)}R`],
      ['Average Efficiency', `${stats.avgEfficiency.toFixed(2)}%`],
      ['Total Commission', `$${stats.totalCommission.toFixed(2)}`]
    ];
    
    return '\n\n' + stringify(statsData, {
      quoted: true,
      quotedString: true,
      delimiter: ','
    });
  }

  private generateStatsCsvData(stats: TradeStats): string[][] {
    return [
      ['Trading Statistics Report'],
      ['Generated on', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      [''],
      ['Metric', 'Value'],
      ['Total Trades', stats.totalTrades.toString()],
      ['Win Trades', stats.winTrades.toString()],
      ['Loss Trades', stats.lossTrades.toString()],
      ['Breakeven Trades', stats.breakevenTrades.toString()],
      ['Win Rate', `${stats.winRate.toFixed(2)}%`],
      ['Total P&L', `$${stats.totalPnl.toFixed(2)}`],
      ['Net P&L', `$${stats.netPnl.toFixed(2)}`],
      ['Average Win', `$${stats.avgWin.toFixed(2)}`],
      ['Average Loss', `$${stats.avgLoss.toFixed(2)}`],
      ['Profit Factor', stats.profitFactor.toFixed(2)],
      ['Max Win', `$${stats.maxWin.toFixed(2)}`],
      ['Max Loss', `$${stats.maxLoss.toFixed(2)}`],
      ['Average R Multiple', `${stats.avgRMultiple.toFixed(2)}R`],
      ['Average Efficiency', `${stats.avgEfficiency.toFixed(2)}%`],
      ['Total Commission', `$${stats.totalCommission.toFixed(2)}`]
    ];
  }
}

// Convenience functions for simple exports
export const exportTradesToCsv = async (
  trades: Trade[], 
  options: Partial<ExportOptions> = {}
): Promise<CsvExportResult> => {
  const exporter = new CsvExporter();
  const finalOptions: ExportOptions = {
    format: 'csv',
    includeStats: true,
    columns: DEFAULT_EXPORT_COLUMNS,
    ...options
  };
  
  return exporter.exportTrades(trades, finalOptions);
};

export const exportStatsToCSv = async (
  stats: TradeStats,
  options: Partial<Omit<ExportOptions, 'columns'>> = {}
): Promise<CsvExportResult> => {
  const exporter = new CsvExporter();
  const finalOptions = {
    format: 'csv' as const,
    includeStats: true,
    ...options
  };
  
  return exporter.exportStats(stats, finalOptions);
};