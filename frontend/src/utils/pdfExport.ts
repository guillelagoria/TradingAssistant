import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
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

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PdfExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
  stats?: TradeStats;
}

export interface PdfExportOptions extends ExportOptions {
  includeCharts?: boolean;
  chartElements?: HTMLElement[];
  pageOrientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyName?: string;
  reportTitle?: string;
}

export class PdfExporter {
  private progressTracker = createProgressTracker();
  private cancelled = false;
  private doc: jsPDF | null = null;

  onProgress(callback: (progress: ExportProgress) => void) {
    this.progressTracker.onProgress(callback);
  }

  removeProgressListener(callback: (progress: ExportProgress) => void) {
    this.progressTracker.removeProgressListener(callback);
  }

  cancel() {
    this.cancelled = true;
  }

  async exportTradesReport(trades: Trade[], options: PdfExportOptions): Promise<PdfExportResult> {
    try {
      this.cancelled = false;
      
      // Initialize PDF
      this.doc = new jsPDF({
        orientation: options.pageOrientation || 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Stage 1: Preparing data
      this.progressTracker.updateProgress({
        stage: 'preparing',
        progress: 10,
        message: 'Preparing trade data...'
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      const filteredTrades = filterTrades(trades, options);
      const stats = calculateExportStats(filteredTrades);
      
      // Stage 2: Creating PDF content
      this.progressTracker.updateProgress({
        stage: 'processing',
        progress: 20,
        message: 'Creating PDF structure...'
      });
      
      // Add header
      if (options.includeHeader !== false) {
        this.addHeader(options);
      }
      
      // Add title and date range
      this.addTitle(options, stats);
      
      // Stage 3: Add statistics summary
      this.progressTracker.updateProgress({
        stage: 'processing',
        progress: 40,
        message: 'Adding statistics summary...'
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      this.addStatsSummary(stats);
      
      // Stage 4: Add charts if requested
      if (options.includeCharts && options.chartElements && options.chartElements.length > 0) {
        this.progressTracker.updateProgress({
          stage: 'processing',
          progress: 50,
          message: 'Capturing charts...'
        });
        
        await this.addCharts(options.chartElements);
        
        if (this.cancelled) throw new Error('Export cancelled');
      }
      
      // Stage 5: Add trades table
      this.progressTracker.updateProgress({
        stage: 'processing',
        progress: 70,
        message: 'Adding trades table...'
      });
      
      await sleep(100);
      
      if (this.cancelled) throw new Error('Export cancelled');
      
      if (filteredTrades.length > 0) {
        this.addTradesTable(filteredTrades, options);
      }
      
      // Add footer
      if (options.includeFooter !== false) {
        this.addFooter();
      }
      
      // Stage 6: Generating PDF
      this.progressTracker.updateProgress({
        stage: 'generating',
        progress: 90,
        message: 'Generating PDF file...'
      });
      
      await sleep(100);
      
      const pdfBlob = this.doc.output('blob');
      const fileName = generateFileName({ ...options, format: 'pdf' }, 'report');
      
      this.progressTracker.updateProgress({
        stage: 'complete',
        progress: 100,
        message: 'Export complete!'
      });
      
      downloadFile(pdfBlob, fileName);
      
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

  private addHeader(options: PdfExportOptions) {
    if (!this.doc) return;
    
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Company name or app title
    this.doc.setFontSize(14);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(options.companyName || 'Trading Diary', pageWidth - 10, 15, { align: 'right' });
    
    // Date
    this.doc.setFontSize(10);
    this.doc.setFont(undefined, 'normal');
    this.doc.text(format(new Date(), 'PPP'), pageWidth - 10, 22, { align: 'right' });
  }

  private addTitle(options: PdfExportOptions, stats: TradeStats) {
    if (!this.doc) return;
    
    let yPosition = 40;
    
    // Main title
    this.doc.setFontSize(20);
    this.doc.setFont(undefined, 'bold');
    this.doc.text(options.reportTitle || 'Trading Performance Report', 20, yPosition);
    
    yPosition += 15;
    
    // Date range if specified
    if (options.dateRange) {
      this.doc.setFontSize(12);
      this.doc.setFont(undefined, 'normal');
      const fromDate = format(options.dateRange.from, 'MMM dd, yyyy');
      const toDate = format(options.dateRange.to, 'MMM dd, yyyy');
      this.doc.text(`Period: ${fromDate} - ${toDate}`, 20, yPosition);
      yPosition += 10;
    }
    
    // Total trades
    this.doc.setFontSize(10);
    this.doc.text(`Total Trades: ${stats.totalTrades}`, 20, yPosition);
  }

  private addStatsSummary(stats: TradeStats) {
    if (!this.doc) return;
    
    let yPosition = 80;
    
    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Performance Summary', 20, yPosition);
    yPosition += 15;
    
    // Create a summary table
    const summaryData = [
      ['Total Trades', stats.totalTrades.toString()],
      ['Win Rate', `${stats.winRate.toFixed(2)}%`],
      ['Total P&L', `$${stats.totalPnl.toFixed(2)}`],
      ['Net P&L', `$${stats.netPnl.toFixed(2)}`],
      ['Profit Factor', stats.profitFactor.toFixed(2)],
      ['Average R Multiple', `${stats.avgRMultiple.toFixed(2)}R`],
      ['Average Efficiency', `${stats.avgEfficiency.toFixed(2)}%`],
      ['Max Win', `$${stats.maxWin.toFixed(2)}`],
      ['Max Loss', `$${stats.maxLoss.toFixed(2)}`],
      ['Total Commission', `$${stats.totalCommission.toFixed(2)}`]
    ];
    
    this.doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });
  }

  private async addCharts(chartElements: HTMLElement[]) {
    if (!this.doc || chartElements.length === 0) return;
    
    // Add a new page for charts
    this.doc.addPage();
    
    let yPosition = 20;
    
    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Performance Charts', 20, yPosition);
    yPosition += 20;
    
    for (let i = 0; i < chartElements.length; i++) {
      if (this.cancelled) throw new Error('Export cancelled');
      
      this.progressTracker.updateProgress({
        stage: 'processing',
        progress: 50 + (i / chartElements.length) * 20,
        message: `Capturing chart ${i + 1}/${chartElements.length}...`
      });
      
      try {
        const canvas = await html2canvas(chartElements[i], {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 170; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page
        if (yPosition + imgHeight > 260) {
          this.doc.addPage();
          yPosition = 20;
        }
        
        this.doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 20;
        
      } catch (error) {
        console.warn('Failed to capture chart:', error);
        // Continue with other charts
      }
      
      await sleep(100); // Allow UI updates
    }
  }

  private addTradesTable(trades: Trade[], options: PdfExportOptions) {
    if (!this.doc || trades.length === 0) return;
    
    // Add a new page for trades table
    this.doc.addPage();
    
    let yPosition = 20;
    
    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont(undefined, 'bold');
    this.doc.text('Trade Details', 20, yPosition);
    yPosition += 15;
    
    // Prepare table data
    const columns = options.columns || DEFAULT_EXPORT_COLUMNS.slice(0, 8); // Limit columns for PDF
    const headers = columns.map(getColumnHeader);
    
    const tableData = trades.map(trade => 
      columns.map(column => {
        const value = formatTradeValue(trade, column);
        return value.length > 20 ? value.substring(0, 17) + '...' : value;
      })
    );
    
    this.doc.autoTable({
      startY: yPosition,
      head: [headers],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: columns.reduce((acc, column, index) => {
        if (column.includes('Price') || column === 'pnl' || column === 'netPnl') {
          acc[index] = { halign: 'right' };
        }
        return acc;
      }, {} as Record<number, any>),
      margin: { left: 10, right: 10 },
      theme: 'striped',
      didDrawPage: (data) => {
        // Add page numbers
        if (this.doc) {
          const pageCount = this.doc.internal.pages.length - 1;
          this.doc.setFontSize(10);
          this.doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            this.doc.internal.pageSize.height - 10
          );
        }
      }
    });
  }

  private addFooter() {
    if (!this.doc) return;
    
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Add a line
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Footer text
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Generated by Trading Diary', 20, pageHeight - 15);
    this.doc.text(
      `Generated on ${format(new Date(), 'PPpp')}`,
      pageWidth - 20,
      pageHeight - 15,
      { align: 'right' }
    );
  }
}

// Convenience functions
export const exportTradesToPdf = async (
  trades: Trade[],
  options: Partial<PdfExportOptions> = {}
): Promise<PdfExportResult> => {
  const exporter = new PdfExporter();
  const finalOptions: PdfExportOptions = {
    format: 'pdf',
    includeStats: true,
    includeCharts: false,
    pageOrientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    reportTitle: 'Trading Performance Report',
    ...options
  };
  
  return exporter.exportTradesReport(trades, finalOptions);
};

export const exportDashboardReport = async (
  trades: Trade[],
  chartElements: HTMLElement[],
  options: Partial<PdfExportOptions> = {}
): Promise<PdfExportResult> => {
  const exporter = new PdfExporter();
  const finalOptions: PdfExportOptions = {
    format: 'pdf',
    includeStats: true,
    includeCharts: true,
    chartElements,
    pageOrientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    reportTitle: 'Trading Dashboard Report',
    ...options
  };
  
  return exporter.exportTradesReport(trades, finalOptions);
};