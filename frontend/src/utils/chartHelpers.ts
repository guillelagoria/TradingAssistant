import { Trade, TradeResult } from '@/types';
import { format, isValid, parseISO } from 'date-fns';

export interface ChartDataPoint {
  date: string;
  value: number;
  formattedDate: string;
  originalDate: Date;
}

export interface CumulativePnLPoint extends ChartDataPoint {
  cumulativePnl: number;
  tradePnl: number;
  tradeCount: number;
}

export interface DailyPnLPoint {
  date: string;
  pnl: number;
  formattedDate: string;
  tradeCount: number;
  winTrades: number;
  lossTrades: number;
}

export interface WinRateData {
  name: string;
  value: number;
  percentage: number;
  count: number;
  color: string;
}

export interface EfficiencyPoint {
  tradeId: string;
  symbol: string;
  pnl: number;
  efficiency: number;
  rMultiple: number;
  result: TradeResult;
  formattedDate: string;
}

// Color constants for consistent theming
export const CHART_COLORS = {
  profit: '#10b981', // green-500
  loss: '#ef4444',   // red-500
  neutral: '#6b7280', // gray-500
  primary: '#3b82f6', // blue-500
  secondary: '#8b5cf6', // purple-500
  grid: '#e5e7eb',   // gray-200
  text: '#374151',   // gray-700
} as const;

// Format currency values for display
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format percentage values
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Safely parse dates
const parseTradeDate = (date: Date | string): Date => {
  if (date instanceof Date) return date;
  if (typeof date === 'string') return parseISO(date);
  return new Date();
};

// Generate cumulative P&L data for line chart
export const generateCumulativePnLData = (trades: Trade[]): CumulativePnLPoint[] => {
  if (!trades.length) return [];

  // Filter closed trades and sort by entry date
  const closedTrades = trades
    .filter(trade => trade.exitPrice && trade.pnl !== undefined)
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  if (!closedTrades.length) return [];

  let cumulativePnl = 0;
  
  return closedTrades.map((trade, index) => {
    cumulativePnl += trade.netPnl || trade.pnl;
    const tradeDate = parseTradeDate(trade.exitDate || trade.entryDate);
    
    return {
      date: format(tradeDate, 'yyyy-MM-dd'),
      formattedDate: format(tradeDate, 'MMM dd, yyyy'),
      originalDate: tradeDate,
      value: cumulativePnl,
      cumulativePnl,
      tradePnl: trade.netPnl || trade.pnl,
      tradeCount: index + 1,
    };
  });
};

// Generate daily P&L data for bar chart
export const generateDailyPnLData = (trades: Trade[]): DailyPnLPoint[] => {
  if (!trades.length) return [];

  const closedTrades = trades.filter(trade => trade.exitPrice && trade.pnl !== undefined);
  
  // Group trades by exit date (or entry date if no exit date)
  const dailyGroups = closedTrades.reduce((groups, trade) => {
    const tradeDate = parseTradeDate(trade.exitDate || trade.entryDate);
    const dateKey = format(tradeDate, 'yyyy-MM-dd');
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        formattedDate: format(tradeDate, 'MMM dd'),
        trades: [],
        totalPnl: 0,
        winTrades: 0,
        lossTrades: 0,
      };
    }
    
    groups[dateKey].trades.push(trade);
    groups[dateKey].totalPnl += trade.netPnl || trade.pnl;
    
    if (trade.result === TradeResult.WIN) groups[dateKey].winTrades++;
    else if (trade.result === TradeResult.LOSS) groups[dateKey].lossTrades++;
    
    return groups;
  }, {} as Record<string, any>);

  return Object.values(dailyGroups)
    .map((group: any) => ({
      date: group.date,
      formattedDate: group.formattedDate,
      pnl: group.totalPnl,
      tradeCount: group.trades.length,
      winTrades: group.winTrades,
      lossTrades: group.lossTrades,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Generate win rate data for donut chart
export const generateWinRateData = (trades: Trade[]): WinRateData[] => {
  const closedTrades = trades.filter(trade => trade.result !== undefined);
  
  if (!closedTrades.length) {
    return [
      {
        name: 'No Data',
        value: 100,
        percentage: 100,
        count: 0,
        color: CHART_COLORS.neutral,
      },
    ];
  }

  const winTrades = closedTrades.filter(trade => trade.result === TradeResult.WIN).length;
  const lossTrades = closedTrades.filter(trade => trade.result === TradeResult.LOSS).length;
  const breakevenTrades = closedTrades.filter(trade => trade.result === TradeResult.BREAKEVEN).length;
  
  const total = closedTrades.length;
  
  const data: WinRateData[] = [];
  
  if (winTrades > 0) {
    data.push({
      name: 'Wins',
      value: winTrades,
      percentage: (winTrades / total) * 100,
      count: winTrades,
      color: CHART_COLORS.profit,
    });
  }
  
  if (lossTrades > 0) {
    data.push({
      name: 'Losses',
      value: lossTrades,
      percentage: (lossTrades / total) * 100,
      count: lossTrades,
      color: CHART_COLORS.loss,
    });
  }
  
  if (breakevenTrades > 0) {
    data.push({
      name: 'Breakeven',
      value: breakevenTrades,
      percentage: (breakevenTrades / total) * 100,
      count: breakevenTrades,
      color: CHART_COLORS.neutral,
    });
  }
  
  return data;
};

// Generate efficiency scatter plot data
export const generateEfficiencyData = (trades: Trade[]): EfficiencyPoint[] => {
  return trades
    .filter(trade => trade.efficiency !== undefined && trade.pnl !== undefined)
    .map(trade => {
      const tradeDate = parseTradeDate(trade.exitDate || trade.entryDate);
      
      return {
        tradeId: trade.id,
        symbol: trade.symbol,
        pnl: trade.netPnl || trade.pnl,
        efficiency: trade.efficiency,
        rMultiple: trade.rMultiple || 0,
        result: trade.result || TradeResult.BREAKEVEN,
        formattedDate: format(tradeDate, 'MMM dd, yyyy'),
      };
    })
    .sort((a, b) => a.pnl - b.pnl);
};

// Custom tooltip formatters
export const formatTooltipValue = (value: any, name: string): [string, string] => {
  if (name.toLowerCase().includes('pnl') || name.toLowerCase().includes('profit')) {
    return [formatCurrency(value), name];
  }
  if (name.toLowerCase().includes('percentage') || name.toLowerCase().includes('rate')) {
    return [formatPercentage(value), name];
  }
  if (name.toLowerCase().includes('efficiency')) {
    return [`${value.toFixed(1)}%`, name];
  }
  if (name.toLowerCase().includes('multiple')) {
    return [`${value.toFixed(2)}R`, name];
  }
  return [value.toString(), name];
};

// Get color based on value (profit/loss)
export const getValueColor = (value: number): string => {
  if (value > 0) return CHART_COLORS.profit;
  if (value < 0) return CHART_COLORS.loss;
  return CHART_COLORS.neutral;
};

// Get result color
export const getResultColor = (result: TradeResult): string => {
  switch (result) {
    case TradeResult.WIN:
      return CHART_COLORS.profit;
    case TradeResult.LOSS:
      return CHART_COLORS.loss;
    default:
      return CHART_COLORS.neutral;
  }
};