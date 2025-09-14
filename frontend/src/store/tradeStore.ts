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
import { calculateTradeMetrics, calculateTradeStats } from '@/utils/tradeCalculations';
import { tradesService } from '@/services/tradesService';
import { applyFilters } from '@/utils/filterHelpers';
import { searchTrades, SearchOptions, DEFAULT_SEARCH_OPTIONS } from '@/utils/searchHelpers';

interface TradeState {
  // Trade data
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
        set({ loading: true, error: null });

        try {
          const response = await tradesService.getTrades(filters, page, limit);

          const tradesWithCalculations = response.data.map(trade => {
            // Only recalculate if values don't exist
            const needsCalculation = !trade.pnl && trade.pnl !== 0;

            if (needsCalculation) {
              const calculations = calculateTradeMetrics(trade);
              return {
                ...trade,
                ...calculations
              };
            } else {
              return trade;
            }
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
          // For now, let the backend handle calculations
          // TODO: Update to use new calculateTradeMetrics signature

          const tradeWithMetrics = {
            ...tradeData,
            status: tradeData.exitPrice ? TradeStatus.CLOSED : TradeStatus.OPEN,
            result: undefined // Let backend calculate this
          };
          
          const newTrade = await tradesService.createTrade(tradeWithMetrics);
          
          set(state => ({
            trades: [newTrade, ...state.trades],
            loading: false
          }));
          
          get().refreshStats();
          get().clearDraft();
          
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
          
          const updatedTrade = await tradesService.updateTrade(id, tradeWithMetrics);
          
          set(state => ({
            trades: state.trades.map(trade => 
              trade.id === id ? updatedTrade : trade
            ),
            currentTrade: state.currentTrade?.id === id ? updatedTrade : state.currentTrade,
            loading: false
          }));
          
          get().refreshStats();
          
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
          await tradesService.deleteTrade(id);
          
          set(state => ({
            trades: state.trades.filter(trade => trade.id !== id),
            currentTrade: state.currentTrade?.id === id ? null : state.currentTrade,
            loading: false
          }));
          
          get().refreshStats();
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete trade', 
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
          const trade = await tradesService.getTrade(id);
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
        set(state => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
        }));
        
        // Fetch trades with new filters
        get().fetchTrades(get().filters);
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