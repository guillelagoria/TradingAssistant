import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Trade,
  TradeFormData,
  TradeFilters,
  TradeSortConfig,
  TradeStats,
  TradeDraft,
  TradeStatus,
  TradeResult,
  FilterPreset,
  SearchField
} from '@/types';
import { calculateTradeMetrics, calculateTradeMetricsForTrade, calculateTradeStats } from '@/utils/tradeCalculations';
import { tradesService } from '@/services/tradesService';
import { applyFilters } from '@/utils/filterHelpers';
import { searchTrades, SearchOptions, DEFAULT_SEARCH_OPTIONS } from '@/utils/searchHelpers';
import useAccountStore from './accountStore';

interface TradeState {
  // Trade data state
  trades: Trade[];
  currentTrade: Trade | null;
  tradeDraft: TradeDraft | null;
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Filters and sorting
  filters: TradeFilters;
  sortConfig: TradeSortConfig;
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Statistics
  stats: TradeStats | null;
  
  // Filter presets
  customPresets: FilterPreset[];
  
  // Search options
  searchOptions: SearchOptions;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Trade CRUD operations
  fetchTrades: (filters?: TradeFilters, page?: number, limit?: number) => Promise<void>;
  addTrade: (tradeData: TradeFormData) => Promise<Trade>;
  updateTrade: (id: string, tradeData: Partial<TradeFormData>) => Promise<Trade>;
  deleteTrade: (id: string) => Promise<void>;
  bulkDeleteTrades: (ids: string[]) => Promise<number>;
  
  // Individual trade operations
  getTrade: (id: string) => Promise<Trade | null>;
  setCurrentTrade: (trade: Trade | null) => void;
  
  // Draft management
  saveDraft: (formData: Partial<TradeFormData>, currentTab: number) => void;
  loadDraft: () => TradeDraft | null;
  clearDraft: () => void;
  
  // Filters and sorting
  setFilters: (filters: Partial<TradeFilters>) => void;
  clearFilters: () => void;
  setSortConfig: (sortConfig: TradeSortConfig) => void;
  
  // Statistics
  refreshStats: () => void;
  
  // Filter presets
  savePreset: (preset: Omit<FilterPreset, 'id'>) => void;
  deletePreset: (presetId: string) => void;
  loadCustomPresets: () => void;
  
  // Search options
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  
  // Account management
  refreshTradesForAccount: (accountId?: string) => Promise<void>;

  // Utility functions
  getFilteredTrades: () => Trade[];
  getSortedTrades: (trades: Trade[]) => Trade[];
  getSearchResults: () => any[];
}

const defaultFilters: TradeFilters = {};

const defaultSortConfig: TradeSortConfig = {
  field: 'entryDate',
  direction: 'desc'
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
};

export const useTradeStore = create<TradeState>()(
  devtools(
    (set, get) => {
      // Load custom presets on initialization
      const loadInitialPresets = () => {
        try {
          const saved = localStorage.getItem('tradeFilterPresets');
          return saved ? JSON.parse(saved) : [];
        } catch (error) {
          console.error('Failed to load initial presets:', error);
          return [];
        }
      };

      return {
        // Initial state
        trades: [],
        currentTrade: null,
        tradeDraft: null,
        loading: false,
        error: null,
        filters: defaultFilters,
        sortConfig: defaultSortConfig,
        pagination: defaultPagination,
        stats: null,
        customPresets: loadInitialPresets(),
        searchOptions: DEFAULT_SEARCH_OPTIONS,
      
      // Basic state setters
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      // Fetch trades with filters and pagination
      fetchTrades: async (filters = {}, page = 1, limit = 20) => {
        console.log('TradeStore: fetchTrades called with:', { filters, page, limit });
        set({ loading: true, error: null });

        try {
          // Get active account ID
          const fetchActiveAccountId = useAccountStore.getState().getActiveAccountId();
          console.log('TradeStore: Fetching trades for active account ID:', fetchActiveAccountId);

          const response = await tradesService.getTrades(filters, page, limit, fetchActiveAccountId);
          console.log('TradeStore: Received response from tradesService:', {
            dataCount: response.data.length,
            pagination: response.pagination
          });

          const tradesWithCalculations = response.data.map(trade => {
            // Always recalculate to ensure result field is present
            const calculations = calculateTradeMetricsForTrade(trade);
            console.log('TradeStore: Calculated metrics for trade:', {
              tradeId: trade.id,
              originalResult: trade.result,
              calculatedResult: calculations.result,
              pnl: calculations.pnl,
              hasExitPrice: !!trade.exitPrice
            });
            return calculations as Trade;
          });

          set({
            trades: tradesWithCalculations,
            pagination: response.pagination,
            loading: false,
            filters: { ...get().filters, ...filters }
          });

          // Refresh stats after fetching trades
          get().refreshStats();
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch trades', 
            loading: false 
          });
        }
      },
      
      // Add new trade
      addTrade: async (tradeData) => {
        set({ loading: true, error: null });

        try {
          // Get active account ID
          const addActiveAccountId = useAccountStore.getState().getActiveAccountId();
          if (!addActiveAccountId) {
            // Try to initialize account store and get default account
            const accountStore = useAccountStore.getState();
            if (accountStore.accounts.length === 0) {
              throw new Error('No accounts available. Please create an account first.');
            }
            // If accounts exist but no active account, use the first one
            const firstAccount = accountStore.accounts[0];
            if (firstAccount) {
              await accountStore.setActiveAccount(firstAccount.id);
            } else {
              throw new Error('No active account selected');
            }
          }

          const tradeWithMetrics = {
            ...tradeData,
            status: tradeData.exitPrice ? TradeStatus.CLOSED : TradeStatus.OPEN,
            result: undefined // Let backend calculate this
          };

          // Get the current active account ID (might have changed)
          const finalActiveAccountId = useAccountStore.getState().getActiveAccountId();
          const newTrade = await tradesService.createTrade(tradeWithMetrics, finalActiveAccountId);
          
          set(state => ({
            trades: [newTrade, ...state.trades],
            loading: false
          }));
          
          get().refreshStats();
          get().clearDraft();

          // Refresh account balance after adding trade
          const accountStore = useAccountStore.getState();
          await accountStore.refreshAccount();

          return newTrade;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add trade', 
            loading: false 
          });
          throw error;
        }
      },
      
      // Update existing trade
      updateTrade: async (id, tradeData) => {
        set({ loading: true, error: null });

        try {
          // Get active account ID
          const updateActiveAccountId = useAccountStore.getState().getActiveAccountId();

          const existingTrade = get().trades.find(t => t.id === id);
          if (!existingTrade) {
            throw new Error('Trade not found');
          }

          const updatedData = { ...existingTrade, ...tradeData };
          const calculatedMetrics = calculateTradeMetrics(updatedData);

          const tradeWithMetrics = {
            ...updatedData,
            ...calculatedMetrics,
            status: updatedData.exitPrice ? TradeStatus.CLOSED : TradeStatus.OPEN,
            result: updatedData.exitPrice
              ? (calculatedMetrics.pnl > 0 ? TradeResult.WIN :
                 calculatedMetrics.pnl < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN)
              : undefined
          };

          const updatedTrade = await tradesService.updateTrade(id, tradeWithMetrics, updateActiveAccountId);
          
          set(state => ({
            trades: state.trades.map(trade => 
              trade.id === id ? updatedTrade : trade
            ),
            currentTrade: state.currentTrade?.id === id ? updatedTrade : state.currentTrade,
            loading: false
          }));
          
          get().refreshStats();

          // Refresh account balance after updating trade
          const accountStore = useAccountStore.getState();
          await accountStore.refreshAccount();

          return updatedTrade;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update trade', 
            loading: false 
          });
          throw error;
        }
      },
      
      // Delete trade
      deleteTrade: async (id) => {
        set({ loading: true, error: null });

        try {
          // Get active account ID
          const deleteActiveAccountId = useAccountStore.getState().getActiveAccountId();
          await tradesService.deleteTrade(id, deleteActiveAccountId);

          set(state => ({
            trades: state.trades.filter(trade => trade.id !== id),
            currentTrade: state.currentTrade?.id === id ? null : state.currentTrade,
            loading: false
          }));

          get().refreshStats();

          // Refresh account balance after deleting trade
          const accountStore = useAccountStore.getState();
          await accountStore.refreshAccount();

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete trade',
            loading: false
          });
          throw error;
        }
      },

      // Bulk delete trades
      bulkDeleteTrades: async (ids) => {
        set({ loading: true, error: null });

        try {
          // Get active account ID
          const bulkActiveAccountId = useAccountStore.getState().getActiveAccountId();
          const deletedCount = await tradesService.bulkDeleteTrades(ids, bulkActiveAccountId);

          set(state => ({
            trades: state.trades.filter(trade => !ids.includes(trade.id)),
            currentTrade: state.currentTrade && ids.includes(state.currentTrade.id) ? null : state.currentTrade,
            loading: false
          }));

          get().refreshStats();

          // Refresh account balance after bulk deleting trades
          const accountStore = useAccountStore.getState();
          await accountStore.refreshAccount();

          return deletedCount;

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete trades',
            loading: false
          });
          throw error;
        }
      },
      
      // Get individual trade
      getTrade: async (id) => {
        const existingTrade = get().trades.find(t => t.id === id);
        if (existingTrade) {
          return existingTrade;
        }

        set({ loading: true, error: null });

        try {
          // Get active account ID
          const getActiveAccountId = useAccountStore.getState().getActiveAccountId();
          const trade = await tradesService.getTrade(id, getActiveAccountId);
          const tradeWithCalculations = {
            ...trade,
            ...calculateTradeMetrics(trade)
          };
          
          // Add to trades array if not already there
          set(state => {
            const existsInArray = state.trades.some(t => t.id === id);
            if (!existsInArray) {
              return {
                trades: [tradeWithCalculations, ...state.trades],
                loading: false
              };
            }
            return { loading: false };
          });
          
          return tradeWithCalculations;
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch trade', 
            loading: false 
          });
          return null;
        }
      },
      
      // Set current trade
      setCurrentTrade: (trade) => set({ currentTrade: trade }),
      
      // Draft management
      saveDraft: (formData, currentTab) => {
        const draft: TradeDraft = {
          formData,
          lastSaved: new Date(),
          currentTab
        };
        
        set({ tradeDraft: draft });
        
        // Save to localStorage for persistence
        localStorage.setItem('tradeDraft', JSON.stringify(draft));
      },
      
      loadDraft: () => {
        try {
          const savedDraft = localStorage.getItem('tradeDraft');
          if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            set({ tradeDraft: draft });
            return draft;
          }
        } catch (error) {
          console.error('Failed to load draft from localStorage:', error);
        }
        return null;
      },
      
      clearDraft: () => {
        set({ tradeDraft: null });
        localStorage.removeItem('tradeDraft');
      },
      
      // Filter management
      setFilters: (newFilters) => {
        console.log('TradeStore: setFilters called with:', newFilters);
        const currentFilters = get().filters;
        console.log('TradeStore: Current filters before update:', currentFilters);

        set(state => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
        }));

        const updatedFilters = get().filters;
        console.log('TradeStore: Updated filters after set:', updatedFilters);

        // Check if this is a client-side only filter (quick filters)
        const isClientSideFilter = Object.keys(newFilters).some(key =>
          ['result', 'rMultipleMin', 'rMultipleMax', 'positionSizeMin', 'positionSizeMax', 'holdingPeriodMin', 'holdingPeriodMax'].includes(key)
        );

        if (isClientSideFilter) {
          console.log('TradeStore: Client-side filter detected, not fetching from backend');
          // Don't fetch from backend for quick filters - they are applied in the component
        } else {
          console.log('TradeStore: Server-side filter detected, fetching from backend');
          // Fetch trades with new filters for server-side filters
          get().fetchTrades(updatedFilters);
        }
      },
      
      clearFilters: () => {
        set({ 
          filters: defaultFilters,
          pagination: { ...defaultPagination }
        });
        
        get().fetchTrades();
      },
      
      // Sort configuration
      setSortConfig: (sortConfig) => {
        set({ sortConfig });
      },
      
      // Statistics
      refreshStats: () => {
        const trades = get().trades;
        const stats = calculateTradeStats(trades);
        set({ stats });
      },
      
      // Utility functions
      getFilteredTrades: () => {
        const { trades, filters } = get();
        return trades.filter(trade => applyFilters(trade, filters));
      },
      
      getSortedTrades: (trades) => {
        const { sortConfig } = get();
        
        return [...trades].sort((a, b) => {
          const aVal = a[sortConfig.field];
          const bVal = b[sortConfig.field];
          
          if (aVal === bVal) return 0;
          
          if (sortConfig.direction === 'asc') {
            return aVal < bVal ? -1 : 1;
          } else {
            return aVal > bVal ? -1 : 1;
          }
        });
      },
      
      // Search functionality
      getSearchResults: () => {
        const { trades, filters, searchOptions } = get();
        
        // If no search term, return empty array
        if (!filters.searchTerm?.trim()) {
          return [];
        }
        
        // Get search options based on current filters
        const options = {
          ...searchOptions,
          fields: filters.searchFields || [SearchField.ALL]
        };
        
        return searchTrades(trades, filters.searchTerm, options);
      },
      
      // Filter presets management
      savePreset: (preset) => {
        const newPreset: FilterPreset = {
          ...preset,
          id: `custom-${Date.now()}`,
          userId: 'current-user' // This would come from auth context in real app
        };
        
        set(state => ({
          customPresets: [...state.customPresets, newPreset]
        }));
        
        // Save to localStorage for persistence
        const presets = get().customPresets;
        localStorage.setItem('tradeFilterPresets', JSON.stringify(presets));
      },
      
      deletePreset: (presetId) => {
        set(state => ({
          customPresets: state.customPresets.filter(p => p.id !== presetId)
        }));
        
        // Update localStorage
        const presets = get().customPresets;
        localStorage.setItem('tradeFilterPresets', JSON.stringify(presets));
      },
      
      loadCustomPresets: () => {
        try {
          const saved = localStorage.getItem('tradeFilterPresets');
          if (saved) {
            const presets = JSON.parse(saved);
            set({ customPresets: presets });
          }
        } catch (error) {
          console.error('Failed to load custom presets:', error);
        }
      },
      
      // Search options
      setSearchOptions: (options) => {
        set(state => ({
          searchOptions: { ...state.searchOptions, ...options }
        }));
      },

      // Account management
      refreshTradesForAccount: async (accountId) => {
        console.log('TradeStore: refreshTradesForAccount called with accountId:', accountId);

        const targetAccountId = accountId || useAccountStore.getState().getActiveAccountId();
        console.log('TradeStore: Target account ID resolved to:', targetAccountId);

        if (!targetAccountId) {
          console.log('TradeStore: No target account ID, clearing trades');
          // Clear trades if no account is active
          set({ trades: [], stats: null });
          return;
        }

        try {
          console.log('TradeStore: Fetching trades for account:', targetAccountId);
          // Fetch trades for the specified account
          await get().fetchTrades();
          console.log('TradeStore: Successfully fetched trades, current trade count:', get().trades.length);
        } catch (error) {
          console.error('Failed to refresh trades for account:', error);
        }
      }
      };
    },
    {
      name: 'trade-store',
      partialize: (state) => ({
        filters: state.filters,
        sortConfig: state.sortConfig,
        pagination: state.pagination,
        customPresets: state.customPresets,
        searchOptions: state.searchOptions
      })
    }
  )
);