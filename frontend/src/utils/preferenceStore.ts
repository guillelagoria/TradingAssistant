import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/user';
import { mergeWithDefaults, validatePreferences, createSettingsBackup } from './settingsHelpers';

// Local storage keys
const STORAGE_KEYS = {
  PREFERENCES: 'trading-diary-preferences',
  BACKUP: 'trading-diary-preferences-backup',
  LAST_SYNC: 'trading-diary-preferences-sync',
} as const;

// Event types for preference changes
export type PreferenceChangeEvent = CustomEvent<{
  preferences: UserPreferences;
  changedFields: string[];
}>;

// Preference store class
export class PreferenceStore {
  private preferences: UserPreferences;
  private originalPreferences: UserPreferences;
  private listeners: Set<(preferences: UserPreferences) => void> = new Set();

  constructor() {
    this.preferences = this.loadFromStorage();
    this.originalPreferences = JSON.parse(JSON.stringify(this.preferences));
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  // Load preferences from localStorage
  private loadFromStorage(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return mergeWithDefaults(parsed);
      }
    } catch (error) {
      console.error('Failed to load preferences from storage:', error);
    }
    
    return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
  }

  // Save preferences to localStorage
  private saveToStorage(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      // Create automatic backup
      this.createBackup(preferences);
    } catch (error) {
      console.error('Failed to save preferences to storage:', error);
    }
  }

  // Handle storage changes from other tabs
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === STORAGE_KEYS.PREFERENCES && event.newValue) {
      try {
        const newPreferences = mergeWithDefaults(JSON.parse(event.newValue));
        this.preferences = newPreferences;
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to handle storage change:', error);
      }
    }
  }

  // Notify all listeners of preference changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.preferences);
      } catch (error) {
        console.error('Error in preference change listener:', error);
      }
    });

    // Dispatch custom event for other components
    const event = new CustomEvent('preferencesChanged', {
      detail: {
        preferences: this.preferences,
        changedFields: this.getChangedFields(),
      }
    }) as PreferenceChangeEvent;
    
    window.dispatchEvent(event);
  }

  // Get changed fields compared to original
  private getChangedFields(): string[] {
    const changes: string[] = [];
    
    function compareObjects(current: any, original: any, prefix = ''): void {
      for (const key in current) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        
        if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
          compareObjects(current[key], original[key] || {}, currentPath);
        } else if (JSON.stringify(current[key]) !== JSON.stringify(original[key])) {
          changes.push(currentPath);
        }
      }
    }
    
    compareObjects(this.preferences, this.originalPreferences);
    return changes;
  }

  // Public API methods
  
  // Get current preferences
  getPreferences(): UserPreferences {
    return JSON.parse(JSON.stringify(this.preferences));
  }

  // Update preferences
  updatePreferences(updates: Partial<UserPreferences>): void {
    const newPreferences = {
      ...this.preferences,
      ...updates,
    };

    // Merge nested objects properly
    if (updates.trading) {
      newPreferences.trading = { ...this.preferences.trading, ...updates.trading };
    }
    if (updates.display) {
      newPreferences.display = {
        ...this.preferences.display,
        ...updates.display,
        currency: { ...this.preferences.display.currency, ...updates.display.currency },
        numberFormat: { ...this.preferences.display.numberFormat, ...updates.display.numberFormat },
        charts: { ...this.preferences.display.charts, ...updates.display.charts },
        dashboard: { ...this.preferences.display.dashboard, ...updates.display.dashboard },
        tables: { ...this.preferences.display.tables, ...updates.display.tables },
      };
    }
    if (updates.account) {
      newPreferences.account = {
        ...this.preferences.account,
        ...updates.account,
        profile: { ...this.preferences.account.profile, ...updates.account.profile },
        security: { ...this.preferences.account.security, ...updates.account.security },
        data: { ...this.preferences.account.data, ...updates.account.data },
        privacy: { ...this.preferences.account.privacy, ...updates.account.privacy },
      };
    }
    if (updates.notifications) {
      newPreferences.notifications = {
        ...this.preferences.notifications,
        ...updates.notifications,
        email: { ...this.preferences.notifications.email, ...updates.notifications.email },
        browser: { ...this.preferences.notifications.browser, ...updates.notifications.browser },
        risk: { ...this.preferences.notifications.risk, ...updates.notifications.risk },
        performance: { ...this.preferences.notifications.performance, ...updates.notifications.performance },
      };
    }

    this.preferences = newPreferences;
    this.saveToStorage(newPreferences);
    this.notifyListeners();
  }

  // Reset preferences to defaults
  resetPreferences(): void {
    this.preferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    this.originalPreferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    this.saveToStorage(this.preferences);
    this.notifyListeners();
  }

  // Reset specific category to defaults
  resetCategory(category: keyof UserPreferences): void {
    const updates = {
      [category]: JSON.parse(JSON.stringify(DEFAULT_PREFERENCES[category]))
    } as Partial<UserPreferences>;
    
    this.updatePreferences(updates);
  }

  // Check if preferences have unsaved changes
  isDirty(): boolean {
    return JSON.stringify(this.preferences) !== JSON.stringify(this.originalPreferences);
  }

  // Save changes (mark as clean)
  saveChanges(): void {
    this.originalPreferences = JSON.parse(JSON.stringify(this.preferences));
    this.saveToStorage(this.preferences);
  }

  // Discard changes (revert to original)
  discardChanges(): void {
    this.preferences = JSON.parse(JSON.stringify(this.originalPreferences));
    this.notifyListeners();
  }

  // Validate current preferences
  validatePreferences() {
    return validatePreferences(this.preferences);
  }

  // Add preference change listener
  addListener(listener: (preferences: UserPreferences) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Remove all listeners (cleanup)
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // Backup and restore methods
  
  // Create backup
  createBackup(preferences?: UserPreferences): void {
    try {
      const backupData = createSettingsBackup(preferences || this.preferences);
      localStorage.setItem(STORAGE_KEYS.BACKUP, backupData);
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  // Restore from backup
  restoreFromBackup(): boolean {
    try {
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (backup) {
        const parsed = JSON.parse(backup);
        const preferences = mergeWithDefaults(parsed.preferences || parsed);
        this.preferences = preferences;
        this.originalPreferences = JSON.parse(JSON.stringify(preferences));
        this.saveToStorage(preferences);
        this.notifyListeners();
        return true;
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
    }
    return false;
  }

  // Export preferences
  exportPreferences(): string {
    return JSON.stringify({
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      preferences: this.preferences,
      metadata: {
        platform: 'Trading Diary',
        userAgent: navigator.userAgent,
      },
    }, null, 2);
  }

  // Import preferences
  importPreferences(data: string): void {
    try {
      const parsed = JSON.parse(data);
      let preferences: UserPreferences;

      if (parsed.preferences) {
        preferences = parsed.preferences;
      } else {
        preferences = parsed;
      }

      const mergedPreferences = mergeWithDefaults(preferences);
      this.preferences = mergedPreferences;
      this.originalPreferences = JSON.parse(JSON.stringify(mergedPreferences));
      this.saveToStorage(mergedPreferences);
      this.notifyListeners();
    } catch (error) {
      throw new Error(`Failed to import preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get storage info
  getStorageInfo(): {
    lastSync: string | null;
    hasBackup: boolean;
    storageUsed: number;
  } {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const hasBackup = localStorage.getItem(STORAGE_KEYS.BACKUP) !== null;
    
    // Calculate approximate storage usage
    let storageUsed = 0;
    try {
      const preferences = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const backup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      storageUsed += (preferences?.length || 0) + (backup?.length || 0);
    } catch (error) {
      console.warn('Could not calculate storage usage:', error);
    }

    return {
      lastSync,
      hasBackup,
      storageUsed,
    };
  }

  // Clear all stored data
  clearStorage(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    this.preferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    this.originalPreferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
    this.notifyListeners();
  }

  // Cleanup method (call on app unmount)
  destroy(): void {
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    this.removeAllListeners();
  }
}

// Create singleton instance
export const preferenceStore = new PreferenceStore();

// Convenience functions for direct usage
export const getPreferences = () => preferenceStore.getPreferences();
export const updatePreferences = (updates: Partial<UserPreferences>) => 
  preferenceStore.updatePreferences(updates);
export const resetPreferences = () => preferenceStore.resetPreferences();
export const isDirty = () => preferenceStore.isDirty();
export const saveChanges = () => preferenceStore.saveChanges();
export const validateCurrentPreferences = () => preferenceStore.validatePreferences();

// React hook for preferences (to be used in useSettings)
export const addPreferenceListener = (listener: (preferences: UserPreferences) => void) =>
  preferenceStore.addListener(listener);

// For backward compatibility with existing code
export default preferenceStore;