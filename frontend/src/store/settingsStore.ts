import { create } from 'zustand';
import { type UserPreferences } from '@/types';

interface SettingsStore {
  preferences: UserPreferences;
  setPreferences: (preferences: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}

const useSettingsStore = create<SettingsStore>((set) => ({
  preferences: {
    commission: 0,
    timezone: 'UTC',
    favoriteSymbols: []
  },
  setPreferences: (preferences) => set({ preferences }),
  updatePreference: (key, value) => 
    set((state) => ({
      preferences: { ...state.preferences, [key]: value }
    }))
}));

export default useSettingsStore;