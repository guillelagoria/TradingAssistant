import axios from 'axios';
import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountStats,
  AccountSummary,
  AccountResponse,
  AccountsResponse,
  AccountStatsResponse,
  AccountSummaryResponse,
  AccountType,
} from '@/types/account';
import { ApiResponse } from '@/types';

// API base URL - can be configured via environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token (when implemented)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token when authentication is implemented
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${message}`);
        case 401:
          // Handle authentication errors - clear auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please log in again.');
        case 403:
          throw new Error('Access forbidden. Insufficient permissions.');
        case 404:
          throw new Error('Account not found.');
        case 422:
          throw new Error(`Validation error: ${message}`);
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(`Server error: ${message}`);
      }
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(`Request failed: ${error.message}`);
    }
  }
);

export const accountService = {
  /**
   * Get all accounts for the current user
   */
  async getAccounts(): Promise<Account[]> {
    try {
      const response = await apiClient.get<AccountsResponse>('/accounts');

      // Convert date strings back to Date objects
      const accountsWithDates = response.data.data.map(account => ({
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      }));

      return accountsWithDates;
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      throw error;
    }
  },

  /**
   * Get a single account by ID
   */
  async getAccount(id: string): Promise<Account> {
    try {
      const response = await apiClient.get<AccountResponse>(`/accounts/${id}`);

      // Convert date strings back to Date objects
      const account = response.data.data;
      return {
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      };
    } catch (error) {
      console.error(`Failed to fetch account ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new account
   */
  async createAccount(accountData: CreateAccountRequest): Promise<Account> {
    try {
      // Convert Date objects to ISO strings for API
      const accountPayload = {
        ...accountData,
        creationDate: accountData.creationDate.toISOString()
      };

      const response = await apiClient.post<AccountResponse>('/accounts', accountPayload);

      // Convert date strings back to Date objects
      const account = response.data.data;
      return {
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      };
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  },

  /**
   * Update an existing account
   */
  async updateAccount(id: string, accountData: UpdateAccountRequest): Promise<Account> {
    try {
      const response = await apiClient.put<AccountResponse>(`/accounts/${id}`, accountData);

      // Convert date strings back to Date objects
      const account = response.data.data;
      return {
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      };
    } catch (error) {
      console.error(`Failed to update account ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<void> {
    try {
      await apiClient.delete(`/accounts/${id}`);
    } catch (error) {
      console.error(`Failed to delete account ${id}:`, error);
      throw error;
    }
  },

  /**
   * Set active account for the user
   */
  async setActiveAccount(accountId: string): Promise<void> {
    try {
      await apiClient.patch(`/accounts/${accountId}/set-active`);
    } catch (error) {
      console.error(`Failed to set active account ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get current active account
   */
  async getActiveAccount(): Promise<Account | null> {
    try {
      const response = await apiClient.get<AccountResponse>('/accounts/active');

      if (!response.data.data) {
        return null;
      }

      // Convert date strings back to Date objects
      const account = response.data.data;
      return {
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      };
    } catch (error) {
      // If no active account is set, return null instead of throwing
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get account statistics
   */
  async getAccountStats(accountId: string): Promise<AccountStats> {
    try {
      const response = await apiClient.get<AccountStatsResponse>(`/accounts/${accountId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch account stats for ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Get account summary for all accounts
   */
  async getAccountsSummary(): Promise<AccountSummary[]> {
    try {
      const response = await apiClient.get<AccountSummaryResponse>('/accounts/summary');
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch accounts summary:', error);
      throw error;
    }
  },

  /**
   * Get accounts by type
   */
  async getAccountsByType(accountType: AccountType): Promise<Account[]> {
    try {
      const response = await apiClient.get<AccountsResponse>(`/accounts?type=${accountType}`);

      // Convert date strings back to Date objects
      const accountsWithDates = response.data.data.map(account => ({
        ...account,
        creationDate: new Date(account.creationDate),
        createdAt: new Date(account.createdAt),
        updatedAt: new Date(account.updatedAt)
      }));

      return accountsWithDates;
    } catch (error) {
      console.error(`Failed to fetch ${accountType} accounts:`, error);
      throw error;
    }
  },

  /**
   * Validate account name uniqueness
   */
  async validateAccountName(name: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ name });
      if (excludeId) {
        params.append('excludeId', excludeId);
      }

      const response = await apiClient.get<ApiResponse<{ isUnique: boolean }>>(
        `/accounts/validate-name?${params.toString()}`
      );

      return response.data.data.isUnique;
    } catch (error) {
      console.error('Failed to validate account name:', error);
      throw error;
    }
  },

  /**
   * Get account performance metrics over time
   */
  async getAccountPerformance(
    accountId: string,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<Array<{ date: string; balance: number; pnl: number; }>> {
    try {
      const response = await apiClient.get<ApiResponse<Array<{ date: string; balance: number; pnl: number; }>>>(
        `/accounts/${accountId}/performance?period=${period}`
      );

      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch account performance for ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Export account data
   */
  async exportAccountData(
    accountId: string,
    format: 'csv' | 'json' = 'csv',
    includeStats: boolean = true
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        format,
        includeStats: includeStats.toString()
      });

      const response = await apiClient.get(
        `/accounts/${accountId}/export?${params.toString()}`,
        { responseType: 'blob' }
      );

      return response.data;
    } catch (error) {
      console.error(`Failed to export account data for ${accountId}:`, error);
      throw error;
    }
  },

  /**
   * Health check specifically for accounts service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/accounts/health');
      return response.data?.status === 'ok';
    } catch (error) {
      console.warn('Accounts service health check failed:', error);
      return false;
    }
  }
};

// Export individual methods for easier testing
export const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  setActiveAccount,
  getActiveAccount,
  getAccountStats,
  getAccountsSummary,
  getAccountsByType,
  validateAccountName,
  getAccountPerformance,
  exportAccountData,
  healthCheck
} = accountService;