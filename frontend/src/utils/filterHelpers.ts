import { 
  Trade, 
  TradeFilters, 
  DatePreset, 
  QuickFilterType,
  TradeResult,
  TradeStatus,
  FilterPreset,
  SearchField 
} from '../types/trade';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subDays, 
  subWeeks, 
  subMonths,
  isWithinInterval,
  differenceInMinutes
} from 'date-fns';

/**
 * Get date range based on preset
 */
export function getDateRangeFromPreset(preset: DatePreset): { from: Date; to: Date } | null {
  const now = new Date();
  
  switch (preset) {
    case DatePreset.TODAY:
      return {
        from: startOfDay(now),
        to: endOfDay(now)
      };
    
    case DatePreset.YESTERDAY:
      const yesterday = subDays(now, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday)
      };
    
    case DatePreset.THIS_WEEK:
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        to: endOfWeek(now, { weekStartsOn: 1 })
      };
    
    case DatePreset.LAST_WEEK:
      const lastWeek = subWeeks(now, 1);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    
    case DatePreset.THIS_MONTH:
      return {
        from: startOfMonth(now),
        to: endOfMonth(now)
      };
    
    case DatePreset.LAST_MONTH:
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    
    case DatePreset.LAST_30_DAYS:
      return {
        from: subDays(now, 30),
        to: now
      };
    
    case DatePreset.LAST_90_DAYS:
      return {
        from: subDays(now, 90),
        to: now
      };
    
    case DatePreset.THIS_YEAR:
      return {
        from: startOfYear(now),
        to: endOfYear(now)
      };
    
    case DatePreset.CUSTOM:
    default:
      return null;
  }
}

/**
 * Get quick filter configuration
 */
export function getQuickFilterConfig(quickFilter: QuickFilterType): Partial<TradeFilters> {
  const now = new Date();
  
  switch (quickFilter) {
    case QuickFilterType.WINNING_TRADES:
      return { result: TradeResult.WIN };
    
    case QuickFilterType.LOSING_TRADES:
      return { result: TradeResult.LOSS };
    
    case QuickFilterType.BREAKEVEN_TRADES:
      return { result: TradeResult.BREAKEVEN };
    
    case QuickFilterType.LARGE_POSITIONS:
      return { positionSizeMin: 1000 };
    
    case QuickFilterType.SHORT_TERM_TRADES:
      return { holdingPeriodMax: 1440 }; // Less than 1 day (1440 minutes)
    
    case QuickFilterType.LONG_TERM_TRADES:
      return { holdingPeriodMin: 7200 }; // More than 5 days (7200 minutes)
    
    case QuickFilterType.HIGH_R_MULTIPLE:
      return { rMultipleMin: 2 };
    
    case QuickFilterType.LOW_R_MULTIPLE:
      return { rMultipleMax: 1 };
    
    case QuickFilterType.HIGH_EFFICIENCY:
      return { efficiencyMin: 80 };
    
    case QuickFilterType.OPEN_TRADES:
      return {}; // Will be handled in filtering logic
    
    case QuickFilterType.CLOSED_TRADES:
      return {}; // Will be handled in filtering logic
    
    default:
      return {};
  }
}

/**
 * Check if a value is within a range (inclusive)
 */
export function isInRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Check if a date is within a range
 */
export function isDateInRange(date: Date, from?: Date, to?: Date): boolean {
  if (!from && !to) return true;
  
  const dateTime = date.getTime();
  
  if (from && to) {
    return isWithinInterval(date, { start: from, end: to });
  }
  
  if (from && dateTime < from.getTime()) return false;
  if (to && dateTime > to.getTime()) return false;
  
  return true;
}

/**
 * Get holding period in minutes for a trade
 */
export function getHoldingPeriod(trade: Trade): number | undefined {
  if (!trade.exitDate) return undefined;
  
  const entryDate = new Date(trade.entryDate);
  const exitDate = new Date(trade.exitDate);
  
  return differenceInMinutes(exitDate, entryDate);
}

/**
 * Apply all filters to a trade
 */
export function applyFilters(trade: Trade, filters: TradeFilters): boolean {
  // Basic filters
  if (filters.symbol && !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) {
    return false;
  }
  
  if (filters.direction && trade.direction !== filters.direction) {
    return false;
  }
  
  if (filters.result && trade.result !== filters.result) {
    return false;
  }
  
  if (filters.strategy && trade.strategy !== filters.strategy) {
    return false;
  }
  
  if (filters.timeframe && trade.timeframe !== filters.timeframe) {
    return false;
  }
  
  if (filters.orderType && trade.orderType !== filters.orderType) {
    return false;
  }
  
  // Multiple selection filters
  if (filters.strategies && filters.strategies.length > 0 && !filters.strategies.includes(trade.strategy)) {
    return false;
  }
  
  if (filters.symbols && filters.symbols.length > 0 && !filters.symbols.includes(trade.symbol)) {
    return false;
  }
  
  // Date filters
  let dateFrom = filters.dateFrom;
  let dateTo = filters.dateTo;
  
  // Apply date preset if specified
  if (filters.datePreset && filters.datePreset !== DatePreset.CUSTOM) {
    const presetRange = getDateRangeFromPreset(filters.datePreset);
    if (presetRange) {
      dateFrom = presetRange.from;
      dateTo = presetRange.to;
    }
  }
  
  if (!isDateInRange(new Date(trade.entryDate), dateFrom, dateTo)) {
    return false;
  }
  
  // P&L range filters
  if (!isInRange(trade.pnl, filters.pnlMin, filters.pnlMax)) {
    return false;
  }
  
  // R-Multiple range filters
  if (!isInRange(trade.rMultiple, filters.rMultipleMin, filters.rMultipleMax)) {
    return false;
  }
  
  // Position size range filters
  const positionSize = trade.positionSize || (trade.quantity * trade.entryPrice);
  if (!isInRange(positionSize, filters.positionSizeMin, filters.positionSizeMax)) {
    return false;
  }
  
  // Efficiency range filters
  if (!isInRange(trade.efficiency, filters.efficiencyMin, filters.efficiencyMax)) {
    return false;
  }
  
  // Holding period range filters
  if (filters.holdingPeriodMin !== undefined || filters.holdingPeriodMax !== undefined) {
    const holdingPeriod = getHoldingPeriod(trade);
    if (holdingPeriod === undefined) {
      // If no holding period (open trade), filter based on the filter criteria
      if (filters.holdingPeriodMin !== undefined) return false;
    } else {
      if (!isInRange(holdingPeriod, filters.holdingPeriodMin, filters.holdingPeriodMax)) {
        return false;
      }
    }
  }
  
  // Quick filter logic
  if (filters.quickFilter) {
    switch (filters.quickFilter) {
      case QuickFilterType.OPEN_TRADES:
        if (trade.status !== TradeStatus.OPEN) return false;
        break;
      case QuickFilterType.CLOSED_TRADES:
        if (trade.status !== TradeStatus.CLOSED) return false;
        break;
      default:
        // Other quick filters are handled by the basic filter logic above
        break;
    }
  }
  
  return true;
}

/**
 * Count active filters
 */
export function getActiveFiltersCount(filters: TradeFilters): number {
  let count = 0;
  
  // Count basic filters
  if (filters.symbol) count++;
  if (filters.direction) count++;
  if (filters.result) count++;
  if (filters.strategy) count++;
  if (filters.timeframe) count++;
  if (filters.orderType) count++;
  
  // Count date filters
  if (filters.datePreset && filters.datePreset !== DatePreset.CUSTOM) count++;
  if (filters.dateFrom || filters.dateTo) count++;
  
  // Count range filters
  if (filters.pnlMin !== undefined || filters.pnlMax !== undefined) count++;
  if (filters.rMultipleMin !== undefined || filters.rMultipleMax !== undefined) count++;
  if (filters.positionSizeMin !== undefined || filters.positionSizeMax !== undefined) count++;
  if (filters.efficiencyMin !== undefined || filters.efficiencyMax !== undefined) count++;
  if (filters.holdingPeriodMin !== undefined || filters.holdingPeriodMax !== undefined) count++;
  
  // Count multiple selection filters
  if (filters.strategies && filters.strategies.length > 0) count++;
  if (filters.symbols && filters.symbols.length > 0) count++;
  
  // Count search filters
  if (filters.searchTerm) count++;
  if (filters.quickFilter) count++;
  
  return count;
}

/**
 * Reset filters to default state
 */
export function getDefaultFilters(): TradeFilters {
  return {};
}

/**
 * Validate filter values
 */
export function validateFilters(filters: TradeFilters): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate P&L range
  if (filters.pnlMin !== undefined && filters.pnlMax !== undefined && filters.pnlMin > filters.pnlMax) {
    errors.push('Minimum P&L cannot be greater than maximum P&L');
  }
  
  // Validate R-Multiple range
  if (filters.rMultipleMin !== undefined && filters.rMultipleMax !== undefined && filters.rMultipleMin > filters.rMultipleMax) {
    errors.push('Minimum R-Multiple cannot be greater than maximum R-Multiple');
  }
  
  // Validate position size range
  if (filters.positionSizeMin !== undefined && filters.positionSizeMax !== undefined && filters.positionSizeMin > filters.positionSizeMax) {
    errors.push('Minimum position size cannot be greater than maximum position size');
  }
  
  // Validate efficiency range
  if (filters.efficiencyMin !== undefined && filters.efficiencyMax !== undefined && filters.efficiencyMin > filters.efficiencyMax) {
    errors.push('Minimum efficiency cannot be greater than maximum efficiency');
  }
  
  // Validate holding period range
  if (filters.holdingPeriodMin !== undefined && filters.holdingPeriodMax !== undefined && filters.holdingPeriodMin > filters.holdingPeriodMax) {
    errors.push('Minimum holding period cannot be greater than maximum holding period');
  }
  
  // Validate date range
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    errors.push('Start date cannot be after end date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Default filter presets
 */
export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'winning-trades',
    name: 'Winning Trades Only',
    description: 'Show only profitable trades',
    filters: { result: TradeResult.WIN },
    isDefault: true
  },
  {
    id: 'losing-trades',
    name: 'Losing Trades Only',
    description: 'Show only losing trades',
    filters: { result: TradeResult.LOSS },
    isDefault: true
  },
  {
    id: 'large-positions',
    name: 'Large Positions',
    description: 'Positions over $1,000',
    filters: { positionSizeMin: 1000 },
    isDefault: true
  },
  {
    id: 'short-term',
    name: 'Short-term Trades',
    description: 'Trades held for less than 1 day',
    filters: { holdingPeriodMax: 1440 },
    isDefault: true
  },
  {
    id: 'this-month',
    name: "This Month's Trades",
    description: 'Trades from the current month',
    filters: { datePreset: DatePreset.THIS_MONTH },
    isDefault: true
  },
  {
    id: 'high-r-multiple',
    name: 'High R-Multiple Trades',
    description: 'Trades with R-Multiple > 2',
    filters: { rMultipleMin: 2 },
    isDefault: true
  }
];

/**
 * Format holding period for display
 */
export function formatHoldingPeriod(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  } else {
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
}