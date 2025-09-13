import { format } from 'date-fns';
import { Trade, TradeStats, TradeDirection, TradeResult, Strategy, Timeframe } from '../types/trade';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  fileName?: string;
  includeStats?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
  filters?: {
    symbols?: string[];
    directions?: TradeDirection[];
    results?: TradeResult[];
    strategies?: Strategy[];
    timeframes?: Timeframe[];
  };
  columns?: (keyof Trade)[];
}

export interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export const DEFAULT_EXPORT_COLUMNS: (keyof Trade)[] = [
  'id',
  'symbol',
  'direction',
  'entryPrice',
  'exitPrice',
  'quantity',
  'entryDate',
  'exitDate',
  'result',
  'pnl',
  'pnlPercentage',
  'efficiency',
  'rMultiple',
  'strategy',
  'timeframe',
  'stopLoss',
  'takeProfit',
  'notes'
];

export const formatTradeValue = (trade: Trade, field: keyof Trade): string => {
  const value = trade[field];
  
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (field) {
    case 'entryDate':
    case 'exitDate':
    case 'createdAt':
    case 'updatedAt':
      return value instanceof Date ? format(value, 'yyyy-MM-dd HH:mm:ss') : '';
    
    case 'entryPrice':
    case 'exitPrice':
    case 'stopLoss':
    case 'takeProfit':
    case 'maxFavorablePrice':
    case 'maxAdversePrice':
      return typeof value === 'number' ? value.toFixed(4) : '';
    
    case 'pnl':
    case 'netPnl':
    case 'commission':
    case 'riskAmount':
      return typeof value === 'number' ? value.toFixed(2) : '';
    
    case 'pnlPercentage':
    case 'efficiency':
    case 'riskPercentage':
      return typeof value === 'number' ? `${value.toFixed(2)}%` : '';
    
    case 'rMultiple':
      return typeof value === 'number' ? `${value.toFixed(2)}R` : '';
    
    case 'quantity':
    case 'positionSize':
      return typeof value === 'number' ? value.toString() : '';
    
    case 'holdingPeriod':
      if (typeof value === 'number') {
        const hours = Math.floor(value / 60);
        const minutes = value % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }
      return '';
    
    default:
      return String(value);
  }
};

export const getColumnHeader = (field: keyof Trade): string => {
  const headers: Record<keyof Trade, string> = {
    id: 'Trade ID',
    userId: 'User ID',
    symbol: 'Symbol',
    direction: 'Direction',
    entryPrice: 'Entry Price',
    exitPrice: 'Exit Price',
    quantity: 'Quantity',
    entryDate: 'Entry Date',
    exitDate: 'Exit Date',
    orderType: 'Order Type',
    result: 'Result',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    positionSize: 'Position Size',
    riskAmount: 'Risk Amount',
    riskPercentage: 'Risk %',
    maxFavorablePrice: 'Max Favorable',
    maxAdversePrice: 'Max Adverse',
    notes: 'Notes',
    strategy: 'Strategy',
    timeframe: 'Timeframe',
    imageUrl: 'Image URL',
    customStrategy: 'Custom Strategy',
    status: 'Status',
    createdAt: 'Created At',
    updatedAt: 'Updated At',
    pnl: 'P&L',
    pnlPercentage: 'P&L %',
    efficiency: 'Efficiency',
    rMultiple: 'R Multiple',
    commission: 'Commission',
    netPnl: 'Net P&L',
    holdingPeriod: 'Holding Period'
  };
  
  return headers[field] || field;
};

export const filterTrades = (trades: Trade[], options: ExportOptions): Trade[] => {
  let filteredTrades = [...trades];
  
  // Date range filter
  if (options.dateRange) {
    filteredTrades = filteredTrades.filter(trade => {
      const entryDate = new Date(trade.entryDate);
      return entryDate >= options.dateRange!.from && entryDate <= options.dateRange!.to;
    });
  }
  
  // Filters
  if (options.filters) {
    const { symbols, directions, results, strategies, timeframes } = options.filters;
    
    if (symbols && symbols.length > 0) {
      filteredTrades = filteredTrades.filter(trade => 
        symbols.includes(trade.symbol)
      );
    }
    
    if (directions && directions.length > 0) {
      filteredTrades = filteredTrades.filter(trade => 
        directions.includes(trade.direction)
      );
    }
    
    if (results && results.length > 0) {
      filteredTrades = filteredTrades.filter(trade => 
        trade.result && results.includes(trade.result)
      );
    }
    
    if (strategies && strategies.length > 0) {
      filteredTrades = filteredTrades.filter(trade => 
        strategies.includes(trade.strategy)
      );
    }
    
    if (timeframes && timeframes.length > 0) {
      filteredTrades = filteredTrades.filter(trade => 
        timeframes.includes(trade.timeframe)
      );
    }
  }
  
  return filteredTrades;
};

export const generateFileName = (options: ExportOptions, type: 'trades' | 'report' = 'trades'): string => {
  if (options.fileName) {
    return `${options.fileName}.${options.format}`;
  }
  
  const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
  const prefix = type === 'trades' ? 'trades' : 'trading-report';
  
  if (options.dateRange) {
    const fromDate = format(options.dateRange.from, 'yyyy-MM-dd');
    const toDate = format(options.dateRange.to, 'yyyy-MM-dd');
    return `${prefix}_${fromDate}_to_${toDate}.${options.format}`;
  }
  
  return `${prefix}_${timestamp}.${options.format}`;
};

export const calculateExportStats = (trades: Trade[]): TradeStats => {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winTrades: 0,
      lossTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      totalPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      maxWin: 0,
      maxLoss: 0,
      avgRMultiple: 0,
      avgEfficiency: 0,
      totalCommission: 0,
      netPnl: 0
    };
  }
  
  const completedTrades = trades.filter(trade => trade.result);
  const winTrades = completedTrades.filter(trade => trade.result === TradeResult.WIN);
  const lossTrades = completedTrades.filter(trade => trade.result === TradeResult.LOSS);
  const breakevenTrades = completedTrades.filter(trade => trade.result === TradeResult.BREAKEVEN);
  
  const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalCommission = trades.reduce((sum, trade) => sum + trade.commission, 0);
  const netPnl = totalPnl - totalCommission;
  
  const avgWin = winTrades.length > 0 
    ? winTrades.reduce((sum, trade) => sum + trade.pnl, 0) / winTrades.length 
    : 0;
  
  const avgLoss = lossTrades.length > 0 
    ? lossTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0) / lossTrades.length 
    : 0;
  
  const totalWinAmount = winTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const totalLossAmount = lossTrades.reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
  
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
  
  const maxWin = winTrades.length > 0 
    ? Math.max(...winTrades.map(trade => trade.pnl)) 
    : 0;
  
  const maxLoss = lossTrades.length > 0 
    ? Math.min(...lossTrades.map(trade => trade.pnl)) 
    : 0;
  
  const avgRMultiple = completedTrades.length > 0
    ? completedTrades.reduce((sum, trade) => sum + trade.rMultiple, 0) / completedTrades.length
    : 0;
  
  const avgEfficiency = completedTrades.length > 0
    ? completedTrades.reduce((sum, trade) => sum + trade.efficiency, 0) / completedTrades.length
    : 0;
  
  return {
    totalTrades: trades.length,
    winTrades: winTrades.length,
    lossTrades: lossTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate: completedTrades.length > 0 ? (winTrades.length / completedTrades.length) * 100 : 0,
    totalPnl,
    avgWin,
    avgLoss,
    profitFactor,
    maxWin,
    maxLoss,
    avgRMultiple,
    avgEfficiency,
    totalCommission,
    netPnl
  };
};

export const createProgressTracker = () => {
  let currentProgress: ExportProgress = {
    stage: 'preparing',
    progress: 0,
    message: 'Initializing export...'
  };
  
  const callbacks: ((progress: ExportProgress) => void)[] = [];
  
  const updateProgress = (update: Partial<ExportProgress>) => {
    currentProgress = { ...currentProgress, ...update };
    callbacks.forEach(callback => callback(currentProgress));
  };
  
  const onProgress = (callback: (progress: ExportProgress) => void) => {
    callbacks.push(callback);
  };
  
  const removeProgressListener = (callback: (progress: ExportProgress) => void) => {
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  };
  
  return {
    updateProgress,
    onProgress,
    removeProgressListener,
    getCurrentProgress: () => currentProgress
  };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Utility to safely download files
export const downloadFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};