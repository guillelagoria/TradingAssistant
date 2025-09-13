import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type UserPreferences, DEFAULT_PREFERENCES, type SettingsCategoryId } from '@/types/user';
import { type Strategy, type Commission } from '@/types/settings';

export interface SettingsStore {
  // State
  preferences: UserPreferences;
  strategies: Strategy[];
  commissions: Commission[];
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
          timestamp: new Date().toISOString(),
        }));
        set({ isDirty: false });
      },

      loadFromLocalStorage: () => {
        try {
          const saved = localStorage.getItem('trading-diary-settings');
          if (saved) {
            const data = JSON.parse(saved);
            set({
              preferences: { ...DEFAULT_PREFERENCES, ...data.preferences },
              strategies: data.strategies || [],
              commissions: data.commissions || get().commissions,
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
          exportedAt: new Date().toISOString(),
          version: '1.0',
        }, null, 2);
      },

      importSettings: (data) => {
        try {
          const parsed = JSON.parse(data);
          set({
            preferences: { ...DEFAULT_PREFERENCES, ...parsed.preferences },
            strategies: parsed.strategies || [],
            commissions: parsed.commissions || get().commissions,
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
      }),
    }
  )
);

export default useSettingsStore;