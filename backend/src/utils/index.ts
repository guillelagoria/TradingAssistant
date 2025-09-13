/**
 * Utility functions for the Trading Diary backend
 */

// Date utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getStartOfYear = (date: Date): Date => {
  return new Date(date.getFullYear(), 0, 1);
};

// Number utilities
export const roundToDecimals = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

// Validation utilities
export const isValidSymbol = (symbol: string): boolean => {
  // Basic symbol validation - alphanumeric and common separators
  const symbolRegex = /^[A-Z0-9._-]+$/i;
  return symbolRegex.test(symbol) && symbol.length >= 1 && symbol.length <= 20;
};

export const isValidPrice = (price: number): boolean => {
  return price > 0 && isFinite(price);
};

export const isValidQuantity = (quantity: number): boolean => {
  return quantity > 0 && isFinite(quantity);
};

// Error utilities
export const createError = (message: string, statusCode: number = 500) => {
  const error = new Error(message) as any;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Object utilities
export const removeNullUndefined = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    if (obj[key] !== null && obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  
  return cleaned;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  
  return result;
};

// Array utilities
export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], keyFn: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// Environment utilities
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  
  return value || defaultValue!;
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

// Pagination utilities
export const calculatePagination = (page: number, limit: number, total: number) => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext,
    hasPrev
  };
};