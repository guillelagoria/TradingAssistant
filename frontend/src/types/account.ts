// Account types for multi-account system

export enum AccountType {
  DEMO = 'DEMO',
  LIVE = 'LIVE'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  TIER1 = 'TIER1',
  TIER2 = 'TIER2',
  ULTIMATE = 'ULTIMATE'
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  accountType: AccountType;
  currency: string;
  creationDate: Date;
  initialBalance: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountRequest {
  name: string;
  accountType: AccountType;
  currency?: string;
  creationDate: Date;
  initialBalance: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  accountType?: AccountType;
  currency?: string;
  initialBalance?: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
  isActive?: boolean;
}

export interface AccountFormData {
  name: string;
  accountType: AccountType;
  currency: string;
  creationDate: Date;
  initialBalance: number;
  currentBalance?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
}

export interface AccountStats {
  // Basic stats
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalPnL: number;
  totalNetPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;

  // Account info
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  roi: number;

  // Drawdown
  maxDrawdown: number;
  currentDrawdown: number;

  // Streak data from backend
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;

  // Advanced metrics (only present when advanced data exists)
  advancedMetrics?: {
    avgMFEEfficiency: number;
    avgMAEEfficiency: number;
    avgRiskRealization: number;
    dataQualityDistribution: Record<string, number>;
  };

  // Data capability flags
  hasAdvancedDataTrades: boolean;
  dataQualityBreakdown: {
    basic: number;
    enhanced: number;
    complete: number;
  };

  // Optional recommendations (in adaptive mode)
  recommendations?: Array<{
    type: 'upgrade' | 'import' | 'complete';
    message: string;
    action: string;
  }>;

  // Legacy fields (for compatibility)
  totalBalance?: number;
  totalPnLPercentage?: number;
  avgTradeReturn?: number;
  bestTrade?: number;
  worstTrade?: number;
  sharpeRatio?: number;
  monthlyReturns?: Array<{
    month: string;
    pnl: number;
    percentage: number;
  }>;
}

// Data Capabilities types
export interface DataCapabilities {
  accountId: string;
  totalTrades: number;
  dataQualityBreakdown: {
    basic: number;
    enhanced: number;
    complete: number;
  };
  availableMetrics: {
    basic: string[];
    advanced: string[];
    missing: string[];
  };
  recommendations: Array<{
    type: 'upgrade' | 'import' | 'complete';
    message: string;
    action: string;
  }>;
  capabilityScore: number;
}

export interface AdaptiveStats {
  stats: AccountStats;
  capabilities: DataCapabilities;
  adaptiveFeatures: {
    showAdvancedMetrics: boolean;
    showEfficiencyAnalysis: boolean;
    showTimingAnalysis: boolean;
    showStrategyBreakdown: boolean;
  };
}

export interface DataQualityBadgeProps {
  score: number;
  breakdown: {
    basic: number;
    enhanced: number;
    complete: number;
  };
  className?: string;
}

export interface CapabilityTooltipProps {
  available: string[];
  missing: string[];
  recommendations?: Array<{
    type: 'upgrade' | 'import' | 'complete';
    message: string;
    action: string;
  }>;
}

export interface AccountSummary {
  id: string;
  name: string;
  accountType: AccountType;
  currency: string;
  currentBalance?: number;
  totalPnL: number;
  totalPnLPercentage: number;
  isActive: boolean;
}

// API Response types
export interface AccountResponse {
  success: boolean;
  data: Account;
  message?: string;
}

export interface AccountsResponse {
  success: boolean;
  data: Account[];
  message?: string;
}

export interface AccountStatsResponse {
  success: boolean;
  data: AccountStats;
  message?: string;
}

export interface AccountSummaryResponse {
  success: boolean;
  data: AccountSummary[];
  message?: string;
}

// Store types
export interface AccountState {
  // Account data
  accounts: Account[];
  activeAccount: Account | null;
  accountStats: Record<string, AccountStats>;

  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Account CRUD operations
  fetchAccounts: () => Promise<void>;
  createAccount: (accountData: CreateAccountRequest) => Promise<Account>;
  updateAccount: (id: string, accountData: UpdateAccountRequest) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;

  // Account operations
  getAccount: (id: string) => Promise<Account | null>;
  setActiveAccount: (account: Account | null) => void;
  switchAccount: (accountId: string) => Promise<void>;

  // Statistics
  fetchAccountStats: (accountId: string) => Promise<AccountStats>;
  refreshAccountStats: (accountId?: string) => Promise<void>;

  // Utility functions
  getActiveAccountId: () => string | null;
  getAccountById: (id: string) => Account | undefined;
  getAccountsByType: (type: AccountType) => Account[];
}

// Validation schemas types
export interface AccountValidationErrors {
  name?: string;
  accountType?: string;
  currency?: string;
  initialBalance?: string;
  currentBalance?: string;
  maxDrawdown?: string;
  profitTarget?: string;
  dataInfoName?: string;
  dataInfoPassword?: string;
  dataInfoNotes?: string;
}

// Form field types for component props
export interface AccountSelectorProps {
  value?: string;
  onValueChange?: (accountId: string) => void;
  accounts?: Account[];
  placeholder?: string;
  className?: string;
  showBalance?: boolean;
  showType?: boolean;
  disabled?: boolean;
}

export interface AccountCardProps {
  account: Account;
  stats?: AccountStats;
  isActive?: boolean;
  onSelect?: (account: Account) => void;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
  className?: string;
}

// Currency options for accounts
export const SUPPORTED_CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
  { value: 'CHF', label: 'Swiss Franc (Fr)', symbol: 'Fr' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number]['value'];

// Account type display options
export const ACCOUNT_TYPE_OPTIONS = [
  { value: AccountType.DEMO, label: 'Demo Account', color: 'blue', description: 'Practice trading with virtual money' },
  { value: AccountType.LIVE, label: 'Live Account', color: 'green', description: 'Real money trading account' },
] as const;