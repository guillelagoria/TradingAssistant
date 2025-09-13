import { Trade, SearchField } from '@/types';

/**
 * Interface for search results with highlighting
 */
export interface SearchResult {
  trade: Trade;
  matchedFields: SearchField[];
  highlights: Record<string, string>;
  score: number;
}

/**
 * Interface for search suggestions
 */
export interface SearchSuggestion {
  text: string;
  field: SearchField;
  count: number;
}

/**
 * Options for search configuration
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  exactMatch?: boolean;
  fuzzyMatch?: boolean;
  maxDistance?: number; // For fuzzy matching
  fields?: SearchField[];
  highlightMatches?: boolean;
}

/**
 * Default search options
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  caseSensitive: false,
  exactMatch: false,
  fuzzyMatch: true,
  maxDistance: 2,
  fields: [SearchField.ALL],
  highlightMatches: true
};

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Check if text matches search term based on options
 */
function isMatch(text: string, searchTerm: string, options: SearchOptions): boolean {
  if (!text || !searchTerm) return false;
  
  const normalizedText = options.caseSensitive ? text : text.toLowerCase();
  const normalizedSearchTerm = options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  if (options.exactMatch) {
    return normalizedText === normalizedSearchTerm;
  }
  
  if (options.fuzzyMatch) {
    const distance = levenshteinDistance(normalizedText, normalizedSearchTerm);
    const maxDistance = options.maxDistance || 2;
    
    // Allow fuzzy match if distance is within threshold or if text contains search term
    return distance <= maxDistance || normalizedText.includes(normalizedSearchTerm);
  }
  
  return normalizedText.includes(normalizedSearchTerm);
}

/**
 * Highlight matches in text
 */
function highlightMatches(text: string, searchTerm: string, options: SearchOptions): string {
  if (!options.highlightMatches || !text || !searchTerm) return text;
  
  const normalizedText = options.caseSensitive ? text : text.toLowerCase();
  const normalizedSearchTerm = options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  if (options.exactMatch) {
    return normalizedText === normalizedSearchTerm 
      ? `<mark>${text}</mark>` 
      : text;
  }
  
  // Simple substring highlighting
  const regex = new RegExp(`(${escapeRegex(normalizedSearchTerm)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get searchable text from trade based on field
 */
function getTradeFieldText(trade: Trade, field: SearchField): string {
  switch (field) {
    case SearchField.SYMBOL:
      return trade.symbol || '';
    case SearchField.NOTES:
      return trade.notes || '';
    case SearchField.STRATEGY:
      return trade.strategy || '';
    case SearchField.CUSTOM_STRATEGY:
      return trade.customStrategy || '';
    case SearchField.ALL:
      return [
        trade.symbol,
        trade.notes,
        trade.strategy,
        trade.customStrategy
      ].filter(Boolean).join(' ');
    default:
      return '';
  }
}

/**
 * Calculate search score based on match quality
 */
function calculateScore(trade: Trade, searchTerm: string, matchedFields: SearchField[], options: SearchOptions): number {
  let score = 0;
  const normalizedSearchTerm = options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
  
  matchedFields.forEach(field => {
    const fieldText = getTradeFieldText(trade, field);
    const normalizedFieldText = options.caseSensitive ? fieldText : fieldText.toLowerCase();
    
    // Exact match gets highest score
    if (normalizedFieldText === normalizedSearchTerm) {
      score += 100;
    }
    // Starts with search term gets high score
    else if (normalizedFieldText.startsWith(normalizedSearchTerm)) {
      score += 75;
    }
    // Contains search term gets medium score
    else if (normalizedFieldText.includes(normalizedSearchTerm)) {
      score += 50;
    }
    // Fuzzy match gets lower score based on distance
    else if (options.fuzzyMatch) {
      const distance = levenshteinDistance(normalizedFieldText, normalizedSearchTerm);
      const maxDistance = options.maxDistance || 2;
      if (distance <= maxDistance) {
        score += Math.max(10, 30 - (distance * 10));
      }
    }
    
    // Bonus for symbol matches (more important)
    if (field === SearchField.SYMBOL) {
      score *= 1.5;
    }
  });
  
  return score;
}

/**
 * Search trades with advanced options
 */
export function searchTrades(
  trades: Trade[], 
  searchTerm: string, 
  options: SearchOptions = DEFAULT_SEARCH_OPTIONS
): SearchResult[] {
  if (!searchTerm.trim()) return trades.map(trade => ({
    trade,
    matchedFields: [],
    highlights: {},
    score: 0
  }));
  
  const results: SearchResult[] = [];
  const fieldsToSearch = options.fields?.includes(SearchField.ALL) 
    ? [SearchField.SYMBOL, SearchField.NOTES, SearchField.STRATEGY, SearchField.CUSTOM_STRATEGY]
    : (options.fields || [SearchField.ALL]);
  
  trades.forEach(trade => {
    const matchedFields: SearchField[] = [];
    const highlights: Record<string, string> = {};
    
    fieldsToSearch.forEach(field => {
      const fieldText = getTradeFieldText(trade, field);
      
      if (isMatch(fieldText, searchTerm, options)) {
        matchedFields.push(field);
        if (options.highlightMatches) {
          highlights[field] = highlightMatches(fieldText, searchTerm, options);
        }
      }
    });
    
    if (matchedFields.length > 0) {
      const score = calculateScore(trade, searchTerm, matchedFields, options);
      results.push({
        trade,
        matchedFields,
        highlights,
        score
      });
    }
  });
  
  // Sort by score (highest first)
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get search suggestions based on existing trades
 */
export function getSearchSuggestions(trades: Trade[], searchTerm?: string): SearchSuggestion[] {
  const suggestions = new Map<string, SearchSuggestion>();
  
  trades.forEach(trade => {
    // Collect symbols
    if (trade.symbol) {
      const key = `symbol:${trade.symbol}`;
      const existing = suggestions.get(key);
      suggestions.set(key, {
        text: trade.symbol,
        field: SearchField.SYMBOL,
        count: (existing?.count || 0) + 1
      });
    }
    
    // Collect strategies
    if (trade.strategy) {
      const key = `strategy:${trade.strategy}`;
      const existing = suggestions.get(key);
      suggestions.set(key, {
        text: trade.strategy,
        field: SearchField.STRATEGY,
        count: (existing?.count || 0) + 1
      });
    }
    
    // Collect custom strategies
    if (trade.customStrategy) {
      const key = `customStrategy:${trade.customStrategy}`;
      const existing = suggestions.get(key);
      suggestions.set(key, {
        text: trade.customStrategy,
        field: SearchField.CUSTOM_STRATEGY,
        count: (existing?.count || 0) + 1
      });
    }
    
    // Extract notable words from notes (simple approach)
    if (trade.notes) {
      const words = trade.notes
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5); // Limit to first 5 words
      
      words.forEach(word => {
        const key = `notes:${word.toLowerCase()}`;
        const existing = suggestions.get(key);
        suggestions.set(key, {
          text: word,
          field: SearchField.NOTES,
          count: (existing?.count || 0) + 1
        });
      });
    }
  });
  
  let result = Array.from(suggestions.values());
  
  // Filter by search term if provided
  if (searchTerm) {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    result = result.filter(suggestion => 
      suggestion.text.toLowerCase().includes(normalizedSearchTerm)
    );
  }
  
  // Sort by count (most common first) and then alphabetically
  return result
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.text.localeCompare(b.text);
    })
    .slice(0, 10); // Limit to 10 suggestions
}

/**
 * Get unique values for autocomplete from a specific field
 */
export function getFieldValues(trades: Trade[], field: SearchField): string[] {
  const values = new Set<string>();
  
  trades.forEach(trade => {
    const text = getTradeFieldText(trade, field);
    if (text.trim()) {
      if (field === SearchField.NOTES) {
        // For notes, extract meaningful words
        text.split(/\s+/)
          .filter(word => word.length > 3)
          .forEach(word => values.add(word.trim()));
      } else {
        values.add(text.trim());
      }
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Create debounced search function
 */
export function createDebouncedSearch<T extends any[]>(
  searchFunction: (...args: T) => void,
  delay: number = 300
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => searchFunction(...args), delay);
  };
}

/**
 * Format search result count
 */
export function formatSearchResultCount(count: number, searchTerm: string): string {
  if (count === 0) {
    return `No results found for "${searchTerm}"`;
  } else if (count === 1) {
    return `1 result found for "${searchTerm}"`;
  } else {
    return `${count} results found for "${searchTerm}"`;
  }
}

/**
 * Extract highlight text from HTML string
 */
export function extractHighlightText(htmlString: string): string {
  return htmlString.replace(/<mark>(.*?)<\/mark>/gi, '$1');
}