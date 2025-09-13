// Main components
export { default as AdvancedFilters } from './AdvancedFilters';
export { default as FilterButton, CompactFilterButton, FilterStatus } from './FilterButton';

// Individual filter components
export { default as DateRangeFilter } from './DateRangeFilter';
export { default as SearchFilter } from './SearchFilter';
export { default as FilterPresets } from './FilterPresets';

// Re-export types for convenience
export type {
  TradeFilters,
  FilterPreset,
  DatePreset,
  SearchField,
  QuickFilterType
} from '@/types';

// Re-export utilities for convenience
export {
  getDateRangeFromPreset,
  getQuickFilterConfig,
  applyFilters,
  getActiveFiltersCount,
  getDefaultFilters,
  validateFilters,
  DEFAULT_FILTER_PRESETS,
  formatHoldingPeriod
} from '@/utils/filterHelpers';

export {
  searchTrades,
  getSearchSuggestions,
  getFieldValues,
  createDebouncedSearch,
  formatSearchResultCount,
  DEFAULT_SEARCH_OPTIONS
} from '@/utils/searchHelpers';