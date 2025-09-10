import { 
  UserPreferences, 
  TradingPreferences, 
  DisplayPreferences, 
  AccountPreferences, 
  NotificationPreferences,
  DEFAULT_PREFERENCES 
} from '@/types/user';

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  category: string;
}

export interface ValidationErrors {
  trading?: Record<string, string>;
  display?: Record<string, string>;
  account?: Record<string, string>;
  notifications?: Record<string, string>;
}

// Settings validation functions
export function validateTradingPreferences(preferences: TradingPreferences): Record<string, string> {
  const errors: Record<string, string> = {};

  // Commission validation
  if (preferences.defaultCommission < 0) {
    errors.defaultCommission = 'Commission cannot be negative';
  }

  // Position size validation
  if (preferences.defaultPositionSizePercent < 0.1 || preferences.defaultPositionSizePercent > 100) {
    errors.defaultPositionSizePercent = 'Position size must be between 0.1% and 100%';
  }

  // Risk tolerance validation
  if (preferences.riskTolerancePercent < 0.1 || preferences.riskTolerancePercent > 10) {
    errors.riskTolerancePercent = 'Risk tolerance must be between 0.1% and 10%';
  }

  // Stop loss validation
  if (preferences.defaultStopLossPercent !== undefined) {
    if (preferences.defaultStopLossPercent <= 0 || preferences.defaultStopLossPercent > 50) {
      errors.defaultStopLossPercent = 'Stop loss must be between 0.1% and 50%';
    }
  }

  // Take profit validation
  if (preferences.defaultTakeProfitPercent !== undefined) {
    if (preferences.defaultTakeProfitPercent <= 0 || preferences.defaultTakeProfitPercent > 100) {
      errors.defaultTakeProfitPercent = 'Take profit must be between 0.1% and 100%';
    }
  }

  // Symbols validation
  if (preferences.favoriteSymbols.length === 0) {
    errors.favoriteSymbols = 'At least one favorite symbol is required';
  }

  // Validate symbol format
  const invalidSymbols = preferences.favoriteSymbols.filter(symbol => 
    !/^[A-Z]{6,}$/.test(symbol) && !/^[A-Z]{3}\/[A-Z]{3}$/.test(symbol)
  );
  if (invalidSymbols.length > 0) {
    errors.favoriteSymbols = `Invalid symbol format: ${invalidSymbols.join(', ')}`;
  }

  return errors;
}

export function validateDisplayPreferences(preferences: DisplayPreferences): Record<string, string> {
  const errors: Record<string, string> = {};

  // Currency decimal places validation
  if (preferences.currency.decimalPlaces < 0 || preferences.currency.decimalPlaces > 8) {
    errors['currency.decimalPlaces'] = 'Decimal places must be between 0 and 8';
  }

  // Number format validation
  if (preferences.numberFormat.decimalPlaces < 0 || preferences.numberFormat.decimalPlaces > 10) {
    errors['numberFormat.decimalPlaces'] = 'Decimal places must be between 0 and 10';
  }

  // Color validation
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!colorRegex.test(preferences.charts.primaryColor)) {
    errors['charts.primaryColor'] = 'Invalid color format. Use hex format (#RRGGBB)';
  }
  if (!colorRegex.test(preferences.charts.successColor)) {
    errors['charts.successColor'] = 'Invalid color format. Use hex format (#RRGGBB)';
  }
  if (!colorRegex.test(preferences.charts.errorColor)) {
    errors['charts.errorColor'] = 'Invalid color format. Use hex format (#RRGGBB)';
  }

  // Cards per row validation
  if (preferences.dashboard.cardsPerRow < 1 || preferences.dashboard.cardsPerRow > 5) {
    errors['dashboard.cardsPerRow'] = 'Cards per row must be between 1 and 5';
  }

  // Rows per page validation
  if (![10, 25, 50, 100].includes(preferences.tables.rowsPerPage)) {
    errors['tables.rowsPerPage'] = 'Invalid rows per page value';
  }

  // Visible columns validation
  if (preferences.tables.visibleColumns.length === 0) {
    errors['tables.visibleColumns'] = 'At least one column must be visible';
  }

  return errors;
}

export function validateAccountPreferences(preferences: AccountPreferences): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (preferences.profile.email && !emailRegex.test(preferences.profile.email)) {
    errors['profile.email'] = 'Invalid email format';
  }

  // Name validation
  if (preferences.profile.name && preferences.profile.name.trim().length < 2) {
    errors['profile.name'] = 'Name must be at least 2 characters long';
  }

  // Session timeout validation
  const validTimeouts = [15, 30, 60, 120, 240, 480];
  if (!validTimeouts.includes(preferences.security.sessionTimeout)) {
    errors['security.sessionTimeout'] = 'Invalid session timeout value';
  }

  // Data retention validation
  const validRetention = [6, 12, 24, 60, -1];
  if (!validRetention.includes(preferences.data.dataRetention)) {
    errors['data.dataRetention'] = 'Invalid data retention value';
  }

  return errors;
}

export function validateNotificationPreferences(preferences: NotificationPreferences): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email threshold validation
  if (preferences.email.largeWinThreshold < 0) {
    errors['email.largeWinThreshold'] = 'Win threshold must be positive';
  }

  if (preferences.email.largeLossThreshold > 0) {
    errors['email.largeLossThreshold'] = 'Loss threshold must be negative';
  }

  // Risk limits validation
  if (preferences.risk.dailyLossLimit < 1 || preferences.risk.dailyLossLimit > 50) {
    errors['risk.dailyLossLimit'] = 'Daily loss limit must be between 1% and 50%';
  }

  if (preferences.risk.consecutiveLossLimit < 2 || preferences.risk.consecutiveLossLimit > 10) {
    errors['risk.consecutiveLossLimit'] = 'Consecutive loss limit must be between 2 and 10';
  }

  if (preferences.risk.drawdownAlert < 5 || preferences.risk.drawdownAlert > 50) {
    errors['risk.drawdownAlert'] = 'Drawdown alert must be between 5% and 50%';
  }

  return errors;
}

// Main validation function
export function validatePreferences(preferences: UserPreferences): ValidationErrors {
  return {
    trading: validateTradingPreferences(preferences.trading),
    display: validateDisplayPreferences(preferences.display),
    account: validateAccountPreferences(preferences.account),
    notifications: validateNotificationPreferences(preferences.notifications),
  };
}

// Settings comparison functions
export function hasPreferencesChanged(current: UserPreferences, original: UserPreferences): boolean {
  return JSON.stringify(current) !== JSON.stringify(original);
}

export function getChangedFields(current: UserPreferences, original: UserPreferences): string[] {
  const changes: string[] = [];
  
  function compareObjects(currentObj: any, originalObj: any, prefix = ''): void {
    for (const key in currentObj) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof currentObj[key] === 'object' && currentObj[key] !== null && !Array.isArray(currentObj[key])) {
        compareObjects(currentObj[key], originalObj[key] || {}, currentPath);
      } else if (JSON.stringify(currentObj[key]) !== JSON.stringify(originalObj[key])) {
        changes.push(currentPath);
      }
    }
  }
  
  compareObjects(current, original);
  return changes;
}

// Settings import/export functions
export interface SettingsExport {
  version: string;
  exportDate: string;
  preferences: UserPreferences;
  metadata: {
    platform: string;
    userAgent: string;
  };
}

export function exportSettings(preferences: UserPreferences): SettingsExport {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    preferences,
    metadata: {
      platform: 'Trading Diary',
      userAgent: navigator.userAgent,
    },
  };
}

export function importSettings(data: any): UserPreferences {
  // Validate import data structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data format');
  }

  let preferences: UserPreferences;

  // Handle different import formats
  if (data.preferences) {
    // Full export format
    preferences = data.preferences;
  } else if (data.trading || data.display || data.account || data.notifications) {
    // Direct preferences format
    preferences = data as UserPreferences;
  } else {
    throw new Error('Invalid preferences format');
  }

  // Merge with defaults to ensure all fields are present
  const mergedPreferences = mergeWithDefaults(preferences);
  
  // Validate the imported settings
  const validationErrors = validatePreferences(mergedPreferences);
  const hasErrors = Object.values(validationErrors).some(categoryErrors => 
    categoryErrors && Object.keys(categoryErrors).length > 0
  );
  
  if (hasErrors) {
    console.warn('Imported settings contain validation errors:', validationErrors);
    // You might want to throw an error or return the errors for handling
  }

  return mergedPreferences;
}

// Merge preferences with defaults
export function mergeWithDefaults(preferences: Partial<UserPreferences>): UserPreferences {
  return {
    trading: { ...DEFAULT_PREFERENCES.trading, ...preferences.trading },
    display: {
      ...DEFAULT_PREFERENCES.display,
      ...preferences.display,
      currency: { ...DEFAULT_PREFERENCES.display.currency, ...preferences.display?.currency },
      numberFormat: { ...DEFAULT_PREFERENCES.display.numberFormat, ...preferences.display?.numberFormat },
      charts: { ...DEFAULT_PREFERENCES.display.charts, ...preferences.display?.charts },
      dashboard: { ...DEFAULT_PREFERENCES.display.dashboard, ...preferences.display?.dashboard },
      tables: { ...DEFAULT_PREFERENCES.display.tables, ...preferences.display?.tables },
    },
    account: {
      ...DEFAULT_PREFERENCES.account,
      ...preferences.account,
      profile: { ...DEFAULT_PREFERENCES.account.profile, ...preferences.account?.profile },
      security: { ...DEFAULT_PREFERENCES.account.security, ...preferences.account?.security },
      data: { ...DEFAULT_PREFERENCES.account.data, ...preferences.account?.data },
      privacy: { ...DEFAULT_PREFERENCES.account.privacy, ...preferences.account?.privacy },
    },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...preferences.notifications,
      email: { ...DEFAULT_PREFERENCES.notifications.email, ...preferences.notifications?.email },
      browser: { ...DEFAULT_PREFERENCES.notifications.browser, ...preferences.notifications?.browser },
      risk: { ...DEFAULT_PREFERENCES.notifications.risk, ...preferences.notifications?.risk },
      performance: { ...DEFAULT_PREFERENCES.notifications.performance, ...preferences.notifications?.performance },
    },
  };
}

// Settings reset functions
export function resetPreferencesToDefaults(): UserPreferences {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES));
}

export function resetCategoryToDefaults(category: keyof UserPreferences): Partial<UserPreferences> {
  return {
    [category]: JSON.parse(JSON.stringify(DEFAULT_PREFERENCES[category]))
  };
}

// Settings formatting functions
export function formatCurrency(
  amount: number, 
  preferences: DisplayPreferences['currency']
): string {
  const formatted = amount.toFixed(preferences.decimalPlaces);
  
  if (preferences.position === 'before') {
    return `${preferences.symbol}${formatted}`;
  } else {
    return `${formatted}${preferences.symbol}`;
  }
}

export function formatNumber(
  number: number,
  preferences: DisplayPreferences['numberFormat']
): string {
  const parts = number.toFixed(preferences.decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, preferences.thousandsSeparator);
  const decimalPart = parts[1];
  
  return decimalPart ? 
    `${integerPart}${preferences.decimalSeparator}${decimalPart}` : 
    integerPart;
}

export function formatDate(
  date: Date,
  format: string,
  timeFormat: '12h' | '24h' = '24h'
): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  let timeString = '';
  if (timeFormat === '12h') {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    timeString = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  } else {
    timeString = `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  let formattedDate = format;
  formattedDate = formattedDate.replace('YYYY', year);
  formattedDate = formattedDate.replace('MM', month);
  formattedDate = formattedDate.replace('DD', day);
  
  return `${formattedDate} ${timeString}`;
}

// Settings migration functions (for future version upgrades)
export function migrateSettings(settings: any, fromVersion: string, toVersion: string): UserPreferences {
  // This function would handle migrating settings between versions
  // For now, just return merged settings with defaults
  console.log(`Migrating settings from ${fromVersion} to ${toVersion}`);
  return mergeWithDefaults(settings);
}

// Settings backup functions
export function createSettingsBackup(preferences: UserPreferences): string {
  const backup = {
    ...exportSettings(preferences),
    backupType: 'automatic',
  };
  
  return JSON.stringify(backup, null, 2);
}

export function restoreSettingsBackup(backupData: string): UserPreferences {
  try {
    const parsed = JSON.parse(backupData);
    return importSettings(parsed);
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}