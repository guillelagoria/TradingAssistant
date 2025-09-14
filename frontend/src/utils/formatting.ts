// Formatting utilities for the trading diary application

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  const defaults: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return new Intl.NumberFormat('en-US', defaults).format(amount);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format R-Multiple
 */
export function formatRMultiple(rMultiple: number): string {
  const sign = rMultiple >= 0 ? '+' : '';
  return `${sign}${rMultiple.toFixed(2)}R`;
}

/**
 * Format a price according to market specifications
 */
export function formatPrice(
  price: number,
  tickSize: number = 0.01,
  precision: number = 2
): string {
  return price.toFixed(precision);
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  }[format];

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format time for display
 */
export function formatTime(
  date: Date | string,
  format: '12h' | '24h' = '24h'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  };

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format datetime for display
 */
export function formatDateTime(
  date: Date | string,
  dateFormat: 'short' | 'medium' | 'long' = 'medium',
  timeFormat: '12h' | '24h' = '24h'
): string {
  const formattedDate = formatDate(date, dateFormat);
  const formattedTime = formatTime(date, timeFormat);
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatLargeNumber(
  value: number,
  decimals: number = 1
): string {
  const suffixes = ['', 'K', 'M', 'B', 'T'];
  let suffixIndex = 0;
  let scaledValue = Math.abs(value);

  while (scaledValue >= 1000 && suffixIndex < suffixes.length - 1) {
    scaledValue /= 1000;
    suffixIndex++;
  }

  const sign = value < 0 ? '-' : '';
  const formatted = scaledValue.toFixed(decimals);
  return `${sign}${formatted}${suffixes[suffixIndex]}`;
}

/**
 * Format position size for display
 */
export function formatPositionSize(
  quantity: number,
  contractSize: number = 1,
  unit: string = 'contracts'
): string {
  if (contractSize === 1) {
    return `${formatNumber(quantity)} ${unit}`;
  }

  const totalSize = quantity * contractSize;
  return `${formatNumber(quantity)} ${unit} (${formatLargeNumber(totalSize)})`;
}

/**
 * Format efficiency as percentage with color coding
 */
export function formatEfficiency(efficiency: number): {
  value: string;
  color: 'green' | 'yellow' | 'red';
} {
  const value = formatPercentage(efficiency);

  let color: 'green' | 'yellow' | 'red';
  if (efficiency >= 80) color = 'green';
  else if (efficiency >= 60) color = 'yellow';
  else color = 'red';

  return { value, color };
}

/**
 * Format P&L with appropriate colors and signs
 */
export function formatPnL(pnl: number): {
  value: string;
  color: 'green' | 'red' | 'gray';
  sign: '+' | '-' | '';
} {
  const sign = pnl > 0 ? '+' : pnl < 0 ? '-' : '';
  const color = pnl > 0 ? 'green' : pnl < 0 ? 'red' : 'gray';
  const value = formatCurrency(Math.abs(pnl));

  return { value, color, sign };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format margin requirement display
 */
export function formatMargin(
  margin: number,
  contracts: number = 1
): string {
  const total = margin * contracts;
  if (contracts === 1) {
    return formatCurrency(total);
  }
  return `${formatCurrency(total)} (${formatCurrency(margin)}/contract)`;
}

/**
 * Format commission display
 */
export function formatCommission(
  commission: number,
  type: 'per_contract' | 'per_share' | 'percentage' = 'per_contract'
): string {
  switch (type) {
    case 'percentage':
      return formatPercentage(commission);
    case 'per_share':
      return `${formatCurrency(commission)}/share`;
    case 'per_contract':
    default:
      return `${formatCurrency(commission)}/contract`;
  }
}