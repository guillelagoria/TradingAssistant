import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type UserPreferences, DEFAULT_PREFERENCES, type SettingsCategoryId } from '@/types/user';
import { type Strategy, type Commission } from '@/types/settings';
import {
  type ContractSpecification,
  type MarketPreset,
  type MarketPreferences,
  type MarketSelection,
  POPULAR_FUTURES_CONTRACTS,
  MARKET_PRESETS,
  DEFAULT_MARKET_CONFIG
} from '@/types/market';
import {
  generateTradeDefaults,
  calculatePositionSize,
  marketValidation
} from '@/utils/marketCalculations';

export interface SettingsStore {
  // State
  preferences: UserPreferences;
  strategies: Strategy[];
  commissions: Commission[];
  marketConfigs: ContractSpecification[];
  marketPresets: MarketPreset[];
  marketPreferences: MarketPreferences;
  selectedMarket: ContractSpecification | null;
  isDirty: boolean;
  isLoading: boolean;
  
  // Basic preference management
  setPreferences: (preferences: UserPreferences) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateCategory: <K extends keyof UserPreferences>(
    category: K,
    updates: Partial<UserPreferences[K]>
  ) => void;
  resetPreferences: () => void;
  resetCategory: (category: SettingsCategoryId) => void;
  
  // Strategy management
  addStrategy: (strategy: Omit<Strategy, 'id' | 'createdAt'>) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  toggleStrategyActive: (id: string) => void;
  reorderStrategies: (fromIndex: number, toIndex: number) => void;
  
  // Commission management  
  addCommission: (commission: Omit<Commission, 'id'>) => void;
  updateCommission: (id: string, updates: Partial<Commission>) => void;
  deleteCommission: (id: string) => void;
  
  // Favorite symbols management
  addFavoriteSymbol: (symbol: string) => void;
  removeFavoriteSymbol: (symbol: string) => void;
  reorderFavoriteSymbols: (fromIndex: number, toIndex: number) => void;

  // Market configuration management
  addMarketConfig: (config: Omit<ContractSpecification, 'id'>) => void;
  updateMarketConfig: (id: string, updates: Partial<ContractSpecification>) => void;
  deleteMarketConfig: (id: string) => void;
  toggleMarketActive: (id: string) => void;
  setSelectedMarket: (marketId: string | null) => void;
  getMarketConfig: (marketId: string) => ContractSpecification | null;

  // Market preset management
  addMarketPreset: (preset: Omit<MarketPreset, 'id' | 'createdAt'>) => void;
  updateMarketPreset: (id: string, updates: Partial<MarketPreset>) => void;
  deleteMarketPreset: (id: string) => void;
  applyMarketPreset: (presetId: string) => void;

  // Market preferences management
  updateMarketPreferences: (updates: Partial<MarketPreferences>) => void;
  addPreferredMarket: (marketId: string) => void;
  removePreferredMarket: (marketId: string) => void;
  setDefaultMarket: (marketId: string) => void;
  addQuickAccessMarket: (marketId: string) => void;
  removeQuickAccessMarket: (marketId: string) => void;

  // Market utility functions
  getTradeDefaults: (marketId?: string, accountBalance?: number, entryPrice?: number) => any;
  calculatePositionSize: (marketId: string, riskAmount: number, entryPrice: number, stopPrice: number) => number;
  validateMarketData: (marketId: string, data: any) => string[];

  // Utility functions
  markDirty: () => void;
  markClean: () => void;
  setLoading: (loading: boolean) => void;

  // Persistence functions
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: DEFAULT_PREFERENCES,
      strategies: [],
      commissions: [
        {
          id: 'default',
          name: 'Default',
          exchange: 'General',
          makerFee: 0.1,
          takerFee: 0.1,
          currency: 'USD',
          type: 'percentage',
          isDefault: true,
        }
      ],
      marketConfigs: POPULAR_FUTURES_CONTRACTS,
      marketPresets: MARKET_PRESETS,
      marketPreferences: {
        preferredMarkets: ['es_futures', 'nq_futures'],
        defaultMarket: 'es_futures',
        quickAccessMarkets: ['es_futures', 'nq_futures'],
        marketSettings: {},
      },
      selectedMarket: DEFAULT_MARKET_CONFIG,
      isDirty: false,
      isLoading: false,

      // Basic preference management
      setPreferences: (preferences) => {
        set({ preferences, isDirty: true });
      },

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
          isDirty: true,
        }));
      },

      updateCategory: (category, updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: { ...state.preferences[category], ...updates },
          },
          isDirty: true,
        }));
      },

      resetPreferences: () => {
        set({
          preferences: DEFAULT_PREFERENCES,
          isDirty: true,
        });
      },

      resetCategory: (category) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: DEFAULT_PREFERENCES[category],
          },
          isDirty: true,
        }));
      },

      // Strategy management
      addStrategy: (strategy) => {
        const newStrategy: Strategy = {
          ...strategy,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          strategies: [...state.strategies, newStrategy],
          isDirty: true,
        }));
      },

      updateStrategy: (id, updates) => {
        set((state) => ({
          strategies: state.strategies.map((strategy) =>
            strategy.id === id ? { ...strategy, ...updates } : strategy
          ),
          isDirty: true,
        }));
      },

      deleteStrategy: (id) => {
        set((state) => ({
          strategies: state.strategies.filter((strategy) => strategy.id !== id),
          isDirty: true,
        }));
      },

      toggleStrategyActive: (id) => {
        set((state) => ({
          strategies: state.strategies.map((strategy) =>
            strategy.id === id ? { ...strategy, isActive: !strategy.isActive } : strategy
          ),
          isDirty: true,
        }));
      },

      reorderStrategies: (fromIndex, toIndex) => {
        set((state) => {
          const strategies = [...state.strategies];
          const [moved] = strategies.splice(fromIndex, 1);
          strategies.splice(toIndex, 0, moved);
          
          return {
            strategies,
            isDirty: true,
          };
        });
      },

      // Commission management
      addCommission: (commission) => {
        const newCommission: Commission = {
          ...commission,
          id: generateId(),
        };
        
        set((state) => ({
          commissions: [...state.commissions, newCommission],
          isDirty: true,
        }));
      },

      updateCommission: (id, updates) => {
        set((state) => ({
          commissions: state.commissions.map((commission) =>
            commission.id === id ? { ...commission, ...updates } : commission
          ),
          isDirty: true,
        }));
      },

      deleteCommission: (id) => {
        set((state) => ({
          commissions: state.commissions.filter((commission) => commission.id !== id),
          isDirty: true,
        }));
      },

      // Favorite symbols management
      addFavoriteSymbol: (symbol) => {
        set((state) => {
          if (state.preferences.trading.favoriteSymbols.includes(symbol)) {
            return state;
          }
          
          return {
            preferences: {
              ...state.preferences,
              trading: {
                ...state.preferences.trading,
                favoriteSymbols: [...state.preferences.trading.favoriteSymbols, symbol],
              },
            },
            isDirty: true,
          };
        });
      },

      removeFavoriteSymbol: (symbol) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            trading: {
              ...state.preferences.trading,
              favoriteSymbols: state.preferences.trading.favoriteSymbols.filter(s => s !== symbol),
            },
          },
          isDirty: true,
        }));
      },

      reorderFavoriteSymbols: (fromIndex, toIndex) => {
        set((state) => {
          const symbols = [...state.preferences.trading.favoriteSymbols];
          const [moved] = symbols.splice(fromIndex, 1);
          symbols.splice(toIndex, 0, moved);
          
          return {
            preferences: {
              ...state.preferences,
              trading: {
                ...state.preferences.trading,
                favoriteSymbols: symbols,
              },
            },
            isDirty: true,
          };
        });
      },

      // Market configuration management
      addMarketConfig: (config) => {
        const newConfig: ContractSpecification = {
          ...config,
          id: generateId(),
        };

        set((state) => ({
          marketConfigs: [...state.marketConfigs, newConfig],
          isDirty: true,
        }));
      },

      updateMarketConfig: (id, updates) => {
        set((state) => ({
          marketConfigs: state.marketConfigs.map((config) =>
            config.id === id ? { ...config, ...updates } : config
          ),
          selectedMarket: state.selectedMarket?.id === id
            ? { ...state.selectedMarket, ...updates }
            : state.selectedMarket,
          isDirty: true,
        }));
      },

      deleteMarketConfig: (id) => {
        set((state) => ({
          marketConfigs: state.marketConfigs.filter((config) => config.id !== id),
          selectedMarket: state.selectedMarket?.id === id ? null : state.selectedMarket,
          marketPreferences: {
            ...state.marketPreferences,
            preferredMarkets: state.marketPreferences.preferredMarkets.filter(mid => mid !== id),
            quickAccessMarkets: state.marketPreferences.quickAccessMarkets.filter(mid => mid !== id),
            defaultMarket: state.marketPreferences.defaultMarket === id ? '' : state.marketPreferences.defaultMarket,
          },
          isDirty: true,
        }));
      },

      toggleMarketActive: (id) => {
        set((state) => ({
          marketConfigs: state.marketConfigs.map((config) =>
            config.id === id ? { ...config, isActive: !config.isActive } : config
          ),
          isDirty: true,
        }));
      },

      setSelectedMarket: (marketId) => {
        const state = get();
        const market = marketId ? state.marketConfigs.find(m => m.id === marketId) || null : null;
        set({ selectedMarket: market, isDirty: true });
      },

      getMarketConfig: (marketId) => {
        const state = get();
        return state.marketConfigs.find(m => m.id === marketId) || null;
      },

      // Market preset management
      addMarketPreset: (preset) => {
        const newPreset: MarketPreset = {
          ...preset,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          marketPresets: [...state.marketPresets, newPreset],
          isDirty: true,
        }));
      },

      updateMarketPreset: (id, updates) => {
        set((state) => ({
          marketPresets: state.marketPresets.map((preset) =>
            preset.id === id ? { ...preset, ...updates, updatedAt: new Date().toISOString() } : preset
          ),
          isDirty: true,
        }));
      },

      deleteMarketPreset: (id) => {
        set((state) => ({
          marketPresets: state.marketPresets.filter((preset) => preset.id !== id),
          isDirty: true,
        }));
      },

      applyMarketPreset: (presetId) => {
        const state = get();
        const preset = state.marketPresets.find(p => p.id === presetId);

        if (preset) {
          set({
            marketConfigs: [...preset.contractSpecs],
            marketPreferences: {
              ...state.marketPreferences,
              preferredMarkets: preset.contractSpecs.map(spec => spec.id),
              defaultMarket: preset.contractSpecs[0]?.id || '',
            },
            selectedMarket: preset.contractSpecs[0] || null,
            isDirty: true,
          });
        }
      },

      // Market preferences management
      updateMarketPreferences: (updates) => {
        set((state) => ({
          marketPreferences: { ...state.marketPreferences, ...updates },
          isDirty: true,
        }));
      },

      addPreferredMarket: (marketId) => {
        set((state) => {
          const preferredMarkets = [...state.marketPreferences.preferredMarkets];
          if (!preferredMarkets.includes(marketId)) {
            preferredMarkets.push(marketId);
          }

          return {
            marketPreferences: { ...state.marketPreferences, preferredMarkets },
            isDirty: true,
          };
        });
      },

      removePreferredMarket: (marketId) => {
        set((state) => ({
          marketPreferences: {
            ...state.marketPreferences,
            preferredMarkets: state.marketPreferences.preferredMarkets.filter(id => id !== marketId),
          },
          isDirty: true,
        }));
      },

      setDefaultMarket: (marketId) => {
        set((state) => ({
          marketPreferences: { ...state.marketPreferences, defaultMarket: marketId },
          isDirty: true,
        }));
      },

      addQuickAccessMarket: (marketId) => {
        set((state) => {
          const quickAccessMarkets = [...state.marketPreferences.quickAccessMarkets];
          if (!quickAccessMarkets.includes(marketId)) {
            quickAccessMarkets.push(marketId);
          }

          return {
            marketPreferences: { ...state.marketPreferences, quickAccessMarkets },
            isDirty: true,
          };
        });
      },

      removeQuickAccessMarket: (marketId) => {
        set((state) => ({
          marketPreferences: {
            ...state.marketPreferences,
            quickAccessMarkets: state.marketPreferences.quickAccessMarkets.filter(id => id !== marketId),
          },
          isDirty: true,
        }));
      },

      // Market utility functions
      getTradeDefaults: (marketId, accountBalance = 100000, entryPrice) => {
        const state = get();
        const market = marketId
          ? state.marketConfigs.find(m => m.id === marketId)
          : state.selectedMarket;

        if (!market) return {};

        return generateTradeDefaults(market, accountBalance, entryPrice);
      },

      calculatePositionSize: (marketId, riskAmount, entryPrice, stopPrice) => {
        const state = get();
        const market = state.marketConfigs.find(m => m.id === marketId);

        if (!market) return 0;

        return calculatePositionSize(
          riskAmount,
          entryPrice,
          stopPrice,
          market,
          market.riskDefaults.defaultPositionSizing
        );
      },

      validateMarketData: (marketId, data) => {
        const state = get();
        const market = state.marketConfigs.find(m => m.id === marketId);

        if (!market) return ['Market configuration not found'];

        const errors: string[] = [];

        // Validate prices
        if (data.entryPrice && !marketValidation.validatePrice(data.entryPrice, market)) {
          errors.push(`Entry price must be a valid increment of ${market.tickSize}`);
        }

        if (data.exitPrice && !marketValidation.validatePrice(data.exitPrice, market)) {
          errors.push(`Exit price must be a valid increment of ${market.tickSize}`);
        }

        if (data.stopLoss && !marketValidation.validatePrice(data.stopLoss, market)) {
          errors.push(`Stop loss must be a valid increment of ${market.tickSize}`);
        }

        if (data.takeProfit && !marketValidation.validatePrice(data.takeProfit, market)) {
          errors.push(`Take profit must be a valid increment of ${market.tickSize}`);
        }

        // Validate quantity
        if (data.quantity && !marketValidation.validateQuantity(data.quantity, market)) {
          errors.push(`Quantity must be a positive integer not exceeding ${market.riskDefaults.maxPositionSize}`);
        }

        return errors;
      },

      // Utility functions
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Persistence functions
      saveToLocalStorage: () => {
        const state = get();
        localStorage.setItem('trading-diary-settings', JSON.stringify({
          preferences: state.preferences,
          strategies: state.strategies,
          commissions: state.commissions,
          marketConfigs: state.marketConfigs,
          marketPresets: state.marketPresets,
          marketPreferences: state.marketPreferences,
          selectedMarket: state.selectedMarket,
          timestamp: new Date().toISOString(),
        }));
        set({ isDirty: false });
      },

      loadFromLocalStorage: () => {
        try {
          const saved = localStorage.getItem('trading-diary-settings');
          if (saved) {
            const data = JSON.parse(saved);
            const currentState = get();
            set({
              preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
              strategies: data.strategies || [],
              commissions: data.commissions || currentState.commissions,
              marketConfigs: data.marketConfigs || currentState.marketConfigs,
              marketPresets: data.marketPresets || currentState.marketPresets,
              marketPreferences: { ...currentState.marketPreferences, ...data.marketPreferences },
              selectedMarket: data.selectedMarket || currentState.selectedMarket,
              isDirty: false,
            });
          }
        } catch (error) {
          console.error('Failed to load settings from localStorage:', error);
        }
      },

      exportSettings: () => {
        const state = get();
        return JSON.stringify({
          preferences: state.preferences,
          strategies: state.strategies,
          commissions: state.commissions,
          marketConfigs: state.marketConfigs,
          marketPresets: state.marketPresets,
          marketPreferences: state.marketPreferences,
          selectedMarket: state.selectedMarket,
          exportedAt: new Date().toISOString(),
          version: '1.1',
        }, null, 2);
      },

      importSettings: (data) => {
        try {
          const parsed = JSON.parse(data);
          const currentState = get();
          set({
            preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
            strategies: parsed.strategies || [],
            commissions: parsed.commissions || currentState.commissions,
            marketConfigs: parsed.marketConfigs || currentState.marketConfigs,
            marketPresets: parsed.marketPresets || currentState.marketPresets,
            marketPreferences: { ...currentState.marketPreferences, ...parsed.marketPreferences },
            selectedMarket: parsed.selectedMarket || currentState.selectedMarket,
            isDirty: true,
          });
        } catch (error) {
          console.error('Failed to import settings:', error);
          throw new Error('Invalid settings format');
        }
      },
    }),
    {
      name: 'trading-diary-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        strategies: state.strategies,
        commissions: state.commissions,
        marketConfigs: state.marketConfigs,
        marketPresets: state.marketPresets,
        marketPreferences: state.marketPreferences,
        selectedMarket: state.selectedMarket,
      }),
    }
  )
);

export default useSettingsStore;