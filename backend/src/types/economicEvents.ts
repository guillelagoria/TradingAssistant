/**
 * Economic Events Types
 * Types for economic calendar events and Finnhub API responses
 */

export interface FinnhubEconomicEvent {
  country: string;
  event: string;
  impact: string;
  actual?: number | null;
  estimate?: number | null;
  previous?: number | null;
  time: string;
  unit?: string;
}

export interface EconomicEvent {
  id: string;
  event: string;
  time: string;
  date: Date;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: number | null;
  estimate: number | null;
  previous: number | null;
  unit?: string;
  relevance: string;
  country: string;
}

export interface EconomicEventFilter {
  startDate?: Date;
  endDate?: Date;
  impact?: ('HIGH' | 'MEDIUM' | 'LOW')[];
  events?: string[];
}

// ES/NQ relevant economic indicators
export const ES_NQ_RELEVANT_EVENTS = [
  // Federal Reserve Events
  'FOMC Meeting',
  'FOMC Minutes',
  'Fed Interest Rate Decision',
  'Federal Reserve Chair Speaks',
  'Fed Chair Powell Speaks',

  // Inflation Indicators
  'CPI',
  'Core CPI',
  'PPI',
  'Core PPI',
  'Core PCE',
  'PCE',

  // Employment Data
  'Non-Farm Payrolls',
  'NFP',
  'Unemployment Rate',
  'Initial Jobless Claims',
  'Continuing Jobless Claims',
  'ADP Employment Change',
  'Average Hourly Earnings',

  // GDP & Growth
  'GDP',
  'GDP Growth Rate',
  'Advance GDP',
  'Final GDP',
  'Preliminary GDP',

  // Manufacturing & Services
  'ISM Manufacturing PMI',
  'ISM Services PMI',
  'ISM Non-Manufacturing PMI',
  'Chicago PMI',
  'Philadelphia Fed Index',
  'Empire State Manufacturing',

  // Consumer Data
  'Retail Sales',
  'Core Retail Sales',
  'Consumer Confidence',
  'Consumer Sentiment',
  'Michigan Consumer Sentiment',

  // Housing Market
  'Building Permits',
  'Housing Starts',
  'Existing Home Sales',
  'New Home Sales',
  'Pending Home Sales',
  'Case-Shiller Home Price Index',

  // Other Important Indicators
  'Durable Goods Orders',
  'Core Durable Goods',
  'Factory Orders',
  'Industrial Production',
  'Trade Balance',
  'Current Account',
  'Treasury Auction',
  'JOLTS Job Openings'
];

// Cache configuration
export const CACHE_CONFIG = {
  TTL: 1800, // 30 minutes in seconds
  CHECK_PERIOD: 600 // Check for expired cache every 10 minutes
};