export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  // Trading Preferences
  trading: TradingPreferences;
  
  // Display Preferences
  display: DisplayPreferences;
  
  // Account Settings
  account: AccountPreferences;
  
  // Notification Settings
  notifications: NotificationPreferences;
}

export interface TradingPreferences {
  // Default commission rate per trade (in currency units)
  defaultCommission: number;
  
  // Default position size as percentage of account (1-100)
  defaultPositionSizePercent: number;
  
  // Risk tolerance percentage per trade (0.5-5)
  riskTolerancePercent: number;
  
  // Preferred trading symbols/watchlist
  favoriteSymbols: string[];
  
  // Default timeframes for analysis
  defaultTimeframes: string[];
  
  // Auto-calculate settings
  autoCalculate: {
    pnl: boolean;
    rMultiple: boolean;
    efficiency: boolean;
    maxFavorablePrice: boolean;
    maxAdversePrice: boolean;
  };
  
  // Trading session timezone
  timezone: string;
  
  // Favorite trading strategies
  favoriteStrategies: string[];
  
  // Default strategy for new trades
  defaultStrategy?: string;
  
  // Stop loss and take profit defaults
  defaultStopLossPercent?: number;
  defaultTakeProfitPercent?: number;
}

export interface DisplayPreferences {
  // Theme selection
  theme: 'light' | 'dark' | 'system';
  
  // Currency display format
  currency: {
    symbol: string; // $, €, £, ¥, etc.
    position: 'before' | 'after'; // $100 vs 100$
    decimalPlaces: number; // 2 for $100.00
  };
  
  // Date format preferences
  dateFormat: string; // 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  
  // Time format
  timeFormat: '12h' | '24h';
  
  // Number format
  numberFormat: {
    thousandsSeparator: string; // ',' or '.'
    decimalSeparator: string; // '.' or ','
    decimalPlaces: number;
  };
  
  // Chart preferences
  charts: {
    colorScheme: 'default' | 'colorblind' | 'highContrast';
    primaryColor: string;
    successColor: string;
    errorColor: string;
    showGridLines: boolean;
    showLabels: boolean;
  };
  
  // Dashboard layout preferences
  dashboard: {
    layout: 'compact' | 'comfortable' | 'spacious';
    showWelcomeMessage: boolean;
    defaultView: 'overview' | 'recent' | 'performance';
    cardsPerRow: number;
  };
  
  // Table preferences
  tables: {
    rowsPerPage: number;
    showRowNumbers: boolean;
    alternateRowColors: boolean;
    visibleColumns: string[]; // Column IDs that are visible
  };
}

export interface AccountPreferences {
  // User profile information
  profile: {
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
  };
  
  // Account security
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number; // in minutes
    loginHistory: boolean;
  };
  
  // Data preferences
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    dataRetention: number; // in months
    exportFormat: 'csv' | 'json' | 'excel';
  };
  
  // Privacy settings
  privacy: {
    shareAnalytics: boolean;
    sharePerformance: boolean;
    allowDataCollection: boolean;
  };
}

export interface NotificationPreferences {
  // Email notifications
  email: {
    enabled: boolean;
    largeWinThreshold: number; // Amount threshold for large win alerts
    largeLossThreshold: number; // Amount threshold for large loss alerts
    weeklyReports: boolean;
    monthlyReports: boolean;
    goalAchievements: boolean;
    systemUpdates: boolean;
  };
  
  // Browser notifications
  browser: {
    enabled: boolean;
    tradeReminders: boolean;
    dailySummary: boolean;
    riskAlerts: boolean;
    goalProgress: boolean;
  };
  
  // Risk management alerts
  risk: {
    enabled: boolean;
    dailyLossLimit: number; // Percentage of account
    consecutiveLossLimit: number; // Number of consecutive losses
    drawdownAlert: number; // Percentage drawdown threshold
    positionSizeAlert: boolean; // Alert for large position sizes
  };
  
  // Performance notifications
  performance: {
    enabled: boolean;
    weeklyPnLSummary: boolean;
    monthlyAnalysis: boolean;
    streakNotifications: boolean; // Win/loss streaks
    milestoneAlerts: boolean; // Account milestones
  };
}

// Settings validation and default values
export const DEFAULT_PREFERENCES: UserPreferences = {
  trading: {
    defaultCommission: 0,
    defaultPositionSizePercent: 2,
    riskTolerancePercent: 1,
    favoriteSymbols: ['EURUSD', 'GBPUSD', 'USDJPY'],
    defaultTimeframes: ['1H', '4H', 'D1'],
    autoCalculate: {
      pnl: true,
      rMultiple: true,
      efficiency: true,
      maxFavorablePrice: true,
      maxAdversePrice: true,
    },
    timezone: 'UTC',
    favoriteStrategies: [],
    defaultStopLossPercent: 2,
    defaultTakeProfitPercent: 4,
  },
  display: {
    theme: 'system',
    currency: {
      symbol: '$',
      position: 'before',
      decimalPlaces: 2,
    },
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
    numberFormat: {
      thousandsSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2,
    },
    charts: {
      colorScheme: 'default',
      primaryColor: '#0ea5e9',
      successColor: '#10b981',
      errorColor: '#ef4444',
      showGridLines: true,
      showLabels: true,
    },
    dashboard: {
      layout: 'comfortable',
      showWelcomeMessage: true,
      defaultView: 'overview',
      cardsPerRow: 3,
    },
    tables: {
      rowsPerPage: 25,
      showRowNumbers: false,
      alternateRowColors: true,
      visibleColumns: ['symbol', 'direction', 'entryPrice', 'exitPrice', 'pnl', 'date'],
    },
  },
  account: {
    profile: {
      name: '',
      email: '',
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 60,
      loginHistory: true,
    },
    data: {
      autoBackup: true,
      backupFrequency: 'weekly',
      dataRetention: 24,
      exportFormat: 'csv',
    },
    privacy: {
      shareAnalytics: false,
      sharePerformance: false,
      allowDataCollection: false,
    },
  },
  notifications: {
    email: {
      enabled: true,
      largeWinThreshold: 500,
      largeLossThreshold: -200,
      weeklyReports: true,
      monthlyReports: true,
      goalAchievements: true,
      systemUpdates: false,
    },
    browser: {
      enabled: false,
      tradeReminders: false,
      dailySummary: false,
      riskAlerts: true,
      goalProgress: true,
    },
    risk: {
      enabled: true,
      dailyLossLimit: 5,
      consecutiveLossLimit: 3,
      drawdownAlert: 10,
      positionSizeAlert: true,
    },
    performance: {
      enabled: true,
      weeklyPnLSummary: true,
      monthlyAnalysis: true,
      streakNotifications: true,
      milestoneAlerts: true,
    },
  },
};

// Settings categories for UI organization
export const SETTINGS_CATEGORIES = {
  trading: {
    id: 'trading',
    title: 'Trading Preferences',
    description: 'Default values and trading-specific settings',
    icon: 'TrendingUp',
  },
  display: {
    id: 'display',
    title: 'Display & Interface',
    description: 'Theme, layout, and visual preferences',
    icon: 'Monitor',
  },
  account: {
    id: 'account',
    title: 'Account Settings',
    description: 'Profile, security, and privacy settings',
    icon: 'User',
  },
  notifications: {
    id: 'notifications',
    title: 'Notifications',
    description: 'Alerts, reports, and notification preferences',
    icon: 'Bell',
  },
} as const;

export type SettingsCategoryId = keyof typeof SETTINGS_CATEGORIES;