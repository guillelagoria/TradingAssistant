const formatters = {
  currency: (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },
  
  percentage: (value: number, decimals: number = 2): string => {
    return `${value.toFixed(decimals)}%`;
  },
  
  number: (value: number, decimals: number = 2): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },
  
  rMultiple: (value: number): string => {
    return `${value.toFixed(2)}R`;
  },
  
  compact: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
};

export default formatters;