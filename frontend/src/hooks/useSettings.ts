import { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '@/types/user';
import { preferenceStore } from '@/utils/preferenceStore';
import { ValidationErrors } from '@/utils/settingsHelpers';

// Settings hook interface
export interface UseSettingsReturn {
  // Current preferences
  preferences: UserPreferences;
  
  // State indicators
  isDirty: boolean;
  isLoading: boolean;
  
  // Validation
  validationErrors: ValidationErrors;
  isValid: boolean;
  
  // Update functions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => Promise<void>;
  resetCategory: (category: keyof UserPreferences) => Promise<void>;
  
  // Save/load functions
  saveSettings: () => Promise<void>;
  discardChanges: () => void;
  
  // Import/export functions
  exportSettings: () => Promise<string>;
  importSettings: (data: string) => Promise<void>;
  
  // Backup functions
  createBackup: () => void;
  restoreFromBackup: () => Promise<boolean>;
  
  // Storage info
  storageInfo: {
    lastSync: string | null;
    hasBackup: boolean;
    storageUsed: number;
  };
}

// Main settings hook
export function useSettings(): UseSettingsReturn {
  const [preferences, setPreferences] = useState<UserPreferences>(() => 
    preferenceStore.getPreferences()
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Update validation when preferences change
  useEffect(() => {
    const errors = preferenceStore.validatePreferences();
    setValidationErrors(errors);
  }, [preferences]);

  // Update dirty state
  useEffect(() => {
    setIsDirty(preferenceStore.isDirty());
  }, [preferences]);

  // Listen for preference changes
  useEffect(() => {
    const unsubscribe = preferenceStore.addListener((newPreferences) => {
      setPreferences(newPreferences);
    });

    return unsubscribe;
  }, []);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    preferenceStore.updatePreferences(updates);
  }, []);

  // Reset all preferences to defaults
  const resetPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      preferenceStore.resetPreferences();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset specific category to defaults
  const resetCategory = useCallback(async (category: keyof UserPreferences) => {
    setIsLoading(true);
    try {
      preferenceStore.resetCategory(category);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings (mark as clean)
  const saveSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      // Validate before saving
      const errors = preferenceStore.validatePreferences();
      const hasErrors = Object.values(errors).some(categoryErrors => 
        categoryErrors && Object.keys(categoryErrors).length > 0
      );
      
      if (hasErrors) {
        throw new Error('Cannot save settings with validation errors');
      }

      // TODO: Send to backend API
      // await api.updateUserPreferences(preferences);
      
      preferenceStore.saveChanges();
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  // Discard changes
  const discardChanges = useCallback(() => {
    preferenceStore.discardChanges();
  }, []);

  // Export settings
  const exportSettings = useCallback(async (): Promise<string> => {
    return preferenceStore.exportPreferences();
  }, []);

  // Import settings
  const importSettings = useCallback(async (data: string) => {
    setIsLoading(true);
    try {
      preferenceStore.importPreferences(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create backup
  const createBackup = useCallback(() => {
    preferenceStore.createBackup();
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      return preferenceStore.restoreFromBackup();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get storage info
  const storageInfo = preferenceStore.getStorageInfo();

  // Check if settings are valid
  const isValid = Object.values(validationErrors).every(categoryErrors => 
    !categoryErrors || Object.keys(categoryErrors).length === 0
  );

  return {
    preferences,
    isDirty,
    isLoading,
    validationErrors,
    isValid,
    updatePreferences,
    resetPreferences,
    resetCategory,
    saveSettings,
    discardChanges,
    exportSettings,
    importSettings,
    createBackup,
    restoreFromBackup,
    storageInfo,
  };
}

// Specific hooks for individual preference categories
export function useTradingPreferences() {
  const { preferences, updatePreferences, validationErrors } = useSettings();
  
  return {
    preferences: preferences.trading,
    updatePreferences: (updates: Partial<UserPreferences['trading']>) => 
      updatePreferences({ trading: updates }),
    validationErrors: validationErrors.trading || {},
  };
}

export function useDisplayPreferences() {
  const { preferences, updatePreferences, validationErrors } = useSettings();
  
  return {
    preferences: preferences.display,
    updatePreferences: (updates: Partial<UserPreferences['display']>) => 
      updatePreferences({ display: updates }),
    validationErrors: validationErrors.display || {},
  };
}

export function useAccountPreferences() {
  const { preferences, updatePreferences, validationErrors } = useSettings();
  
  return {
    preferences: preferences.account,
    updatePreferences: (updates: Partial<UserPreferences['account']>) => 
      updatePreferences({ account: updates }),
    validationErrors: validationErrors.account || {},
  };
}

export function useNotificationPreferences() {
  const { preferences, updatePreferences, validationErrors } = useSettings();
  
  return {
    preferences: preferences.notifications,
    updatePreferences: (updates: Partial<UserPreferences['notifications']>) => 
      updatePreferences({ notifications: updates }),
    validationErrors: validationErrors.notifications || {},
  };
}

// Hook for theme preferences (commonly used)
export function useTheme() {
  const { preferences, updatePreferences } = useSettings();
  
  const setTheme = useCallback((theme: UserPreferences['display']['theme']) => {
    updatePreferences({
      display: {
        ...preferences.display,
        theme,
      },
    });
  }, [preferences.display, updatePreferences]);

  return {
    theme: preferences.display.theme,
    setTheme,
  };
}

// Hook for currency formatting (commonly used)
export function useCurrencyFormat() {
  const { preferences } = useSettings();
  
  const formatCurrency = useCallback((amount: number): string => {
    const { currency } = preferences.display;
    const formatted = amount.toFixed(currency.decimalPlaces);
    
    if (currency.position === 'before') {
      return `${currency.symbol}${formatted}`;
    } else {
      return `${formatted}${currency.symbol}`;
    }
  }, [preferences.display.currency]);

  return {
    formatCurrency,
    currencySymbol: preferences.display.currency.symbol,
    currencyPosition: preferences.display.currency.position,
    decimalPlaces: preferences.display.currency.decimalPlaces,
  };
}

// Hook for number formatting (commonly used)
export function useNumberFormat() {
  const { preferences } = useSettings();
  
  const formatNumber = useCallback((number: number, decimals?: number): string => {
    const { numberFormat } = preferences.display;
    const decimalPlaces = decimals ?? numberFormat.decimalPlaces;
    
    const parts = number.toFixed(decimalPlaces).split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, numberFormat.thousandsSeparator);
    const decimalPart = parts[1];
    
    return decimalPart ? 
      `${integerPart}${numberFormat.decimalSeparator}${decimalPart}` : 
      integerPart;
  }, [preferences.display.numberFormat]);

  return {
    formatNumber,
    thousandsSeparator: preferences.display.numberFormat.thousandsSeparator,
    decimalSeparator: preferences.display.numberFormat.decimalSeparator,
    decimalPlaces: preferences.display.numberFormat.decimalPlaces,
  };
}

// Hook for date formatting (commonly used)
export function useDateFormat() {
  const { preferences } = useSettings();
  
  const formatDate = useCallback((date: Date, includeTime = false): string => {
    const { dateFormat, timeFormat } = preferences.display;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    let formattedDate = dateFormat;
    formattedDate = formattedDate.replace('YYYY', year);
    formattedDate = formattedDate.replace('MM', month);
    formattedDate = formattedDate.replace('DD', day);
    
    if (includeTime) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      let timeString = '';
      if (timeFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeString = ` ${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      } else {
        timeString = ` ${hours.toString().padStart(2, '0')}:${minutes}`;
      }
      
      formattedDate += timeString;
    }
    
    return formattedDate;
  }, [preferences.display.dateFormat, preferences.display.timeFormat]);

  return {
    formatDate,
    dateFormat: preferences.display.dateFormat,
    timeFormat: preferences.display.timeFormat,
  };
}

export default useSettings;