import axios from 'axios';
import { Trade, TradeFormData, TradeFilters, ApiResponse, PaginatedResponse } from '@/types';

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
    const token = localStorage.getItem('authToken');
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
          // Handle authentication errors
          localStorage.removeItem('authToken');
          throw new Error('Authentication required. Please log in.');
        case 403:
          throw new Error('Access forbidden. Insufficient permissions.');
        case 404:
          throw new Error('Resource not found.');
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

// Build query string from filters
function buildQueryParams(filters: TradeFilters = {}, page?: number, limit?: number, accountId?: string): string {
  const params = new URLSearchParams();

  // Add accountId param if provided
  if (accountId) params.append('accountId', accountId);

  // Add pagination params
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  // Add filter params
  if (filters.symbol) params.append('symbol', filters.symbol);
  if (filters.direction) params.append('direction', filters.direction);
  if (filters.result) params.append('result', filters.result);
  if (filters.strategy) params.append('strategy', filters.strategy);
  if (filters.timeframe) params.append('timeframe', filters.timeframe);
  
  // Date filters
  if (filters.dateFrom) {
    params.append('dateFrom', filters.dateFrom.toISOString());
  }
  if (filters.dateTo) {
    params.append('dateTo', filters.dateTo.toISOString());
  }
  
  // PnL range filters
  if (filters.pnlMin !== undefined) {
    params.append('pnlMin', filters.pnlMin.toString());
  }
  if (filters.pnlMax !== undefined) {
    params.append('pnlMax', filters.pnlMax.toString());
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export const tradesService = {
  /**
   * Get all trades with optional filtering and pagination
   */
  async getTrades(
    filters: TradeFilters = {},
    page: number = 1,
    limit: number = 20,
    accountId?: string
  ): Promise<PaginatedResponse<Trade>> {
    try {
      const queryParams = buildQueryParams(filters, page, limit, accountId);
      const fullUrl = `/trades${queryParams}`;
      console.log('🌐 [tradesService.getTrades] Making request to:', fullUrl);
      console.log('🌐 [tradesService.getTrades] With accountId:', accountId);
      console.log('🌐 [tradesService.getTrades] API Base URL:', apiClient.defaults.baseURL);

      const response = await apiClient.get<PaginatedResponse<Trade>>(fullUrl);
      console.log('🌐 [tradesService.getTrades] Response received:', response.data.data?.trades?.length || 0, 'trades');

      // Handle both possible response formats
      const responseData = response.data.data || response.data;
      const trades = responseData.trades || [];

      // Convert date strings back to Date objects
      const tradesWithDates = trades.map(trade => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      }));

      return {
        data: tradesWithDates,
        pagination: responseData.pagination,
        success: response.data.success
      };
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      throw error;
    }
  },

  /**
   * Get a single trade by ID
   */
  async getTrade(id: string, accountId?: string): Promise<Trade> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      const response = await apiClient.get<ApiResponse<Trade>>(`/trades/${id}${queryString}`);

      // Convert date strings back to Date objects
      const trade = response.data.data;
      return {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      };
    } catch (error) {
      console.error(`Failed to fetch trade ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new trade
   */
  async createTrade(tradeData: TradeFormData, accountId?: string): Promise<Trade> {
    try {
      // Convert Date objects to ISO strings for API
      const tradePayload = {
        ...tradeData,
        entryDate: tradeData.entryDate.toISOString(),
        exitDate: tradeData.exitDate?.toISOString(),
        accountId: accountId // Always include accountId
      };
      
      const response = await apiClient.post<ApiResponse<Trade>>('/trades', tradePayload);
      
      // Convert date strings back to Date objects
      const trade = response.data.data;
      return {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      };
    } catch (error) {
      console.error('Failed to create trade:', error);
      throw error;
    }
  },

  /**
   * Update an existing trade
   */
  async updateTrade(id: string, tradeData: Partial<TradeFormData>, accountId?: string): Promise<Trade> {
    try {
      // Convert Date objects to ISO strings for API
      const tradePayload = {
        ...tradeData,
        entryDate: tradeData.entryDate?.toISOString(),
        exitDate: tradeData.exitDate?.toISOString(),
        ...(accountId && { accountId })
      };
      
      const response = await apiClient.put<ApiResponse<Trade>>(`/trades/${id}`, tradePayload);
      
      // Convert date strings back to Date objects
      const trade = response.data.data;
      return {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      };
    } catch (error) {
      console.error(`Failed to update trade ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a trade
   */
  async deleteTrade(id: string, accountId?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      await apiClient.delete(`/trades/${id}${queryString}`);
    } catch (error) {
      console.error(`Failed to delete trade ${id}:`, error);
      throw error;
    }
  },

  /**
   * Bulk delete trades
   */
  async bulkDeleteTrades(ids: string[], accountId?: string): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<{ deleted: number }>>('/trades/bulk-delete', {
        ids,
        ...(accountId && { accountId })
      });
      return response.data.data.deleted;
    } catch (error) {
      console.error('Failed to bulk delete trades:', error);
      throw error;
    }
  },

  /**
   * Bulk operations
   */
  
  /**
   * Import multiple trades
   */
  async importTrades(trades: TradeFormData[], accountId?: string): Promise<Trade[]> {
    try {
      const tradesPayload = trades.map(trade => ({
        ...trade,
        entryDate: trade.entryDate.toISOString(),
        exitDate: trade.exitDate?.toISOString(),
        ...(accountId && { accountId })
      }));

      const response = await apiClient.post<ApiResponse<Trade[]>>('/trades/bulk', {
        trades: tradesPayload
      });
      
      // Convert date strings back to Date objects
      return response.data.data.map(trade => ({
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to import trades:', error);
      throw error;
    }
  },

  /**
   * Export trades to CSV/JSON
   */
  async exportTrades(
    format: 'csv' | 'json' = 'csv',
    filters: TradeFilters = {},
    accountId?: string
  ): Promise<Blob> {
    try {
      const queryParams = buildQueryParams(filters, undefined, undefined, accountId);
      const separator = queryParams ? '&' : '?';
      const response = await apiClient.get(
        `/trades/export${queryParams}${separator}format=${format}`,
        { responseType: 'blob' }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to export trades:', error);
      throw error;
    }
  },

  /**
   * Get trade statistics
   */
  async getTradeStats(filters: TradeFilters = {}, accountId?: string): Promise<any> {
    try {
      const queryParams = buildQueryParams(filters, undefined, undefined, accountId);
      const response = await apiClient.get<ApiResponse<any>>(`/trades/stats${queryParams}`);

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch trade statistics:', error);
      throw error;
    }
  },

  /**
   * Upload trade image/screenshot
   */
  async uploadTradeImage(tradeId: string, file: File, accountId?: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (accountId) formData.append('accountId', accountId);

      const response = await apiClient.post<ApiResponse<{ imageUrl: string }>>(
        `/trades/${tradeId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data.imageUrl;
    } catch (error) {
      console.error('Failed to upload trade image:', error);
      throw error;
    }
  },

  /**
   * Delete trade image
   */
  async deleteTradeImage(tradeId: string, accountId?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      const queryString = params.toString() ? `?${params.toString()}` : '';

      await apiClient.delete(`/trades/${tradeId}/image${queryString}`);
    } catch (error) {
      console.error('Failed to delete trade image:', error);
      throw error;
    }
  },

  /**
   * Create a quick trade (optimized for speed)
   */
  async createQuickTrade(quickTradeData: {
    symbol: string;
    direction: string;
    entryPrice: number;
    quantity: number;
    stopLoss?: number;
    result?: number;
    accountId?: string;
    source?: string;
  }, image?: File): Promise<Trade> {
    try {
      let response: any;

      if (image) {
        // Create FormData for multipart upload
        const formData = new FormData();

        // Add trade data as JSON
        formData.append('tradeData', JSON.stringify(quickTradeData));

        // Add image file
        formData.append('image', image);

        response = await apiClient.post<ApiResponse<Trade>>('/trades/quick', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Regular JSON request without image
        response = await apiClient.post<ApiResponse<Trade>>('/trades/quick', quickTradeData);
      }

      // Convert date strings back to Date objects
      const trade = response.data.data;
      return {
        ...trade,
        entryDate: new Date(trade.entryDate),
        exitDate: trade.exitDate ? new Date(trade.exitDate) : undefined,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt)
      };
    } catch (error) {
      console.error('Failed to create quick trade:', error);
      throw error;
    }
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Note: Health endpoint is at /health, not /api/health
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.data?.status === 'ok';
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }
};

// Export individual methods for easier testing
export const {
  getTrades,
  getTrade,
  createTrade,
  updateTrade,
  deleteTrade,
  bulkDeleteTrades,
  importTrades,
  exportTrades,
  getTradeStats,
  uploadTradeImage,
  deleteTradeImage,
  createQuickTrade,
  healthCheck
} = tradesService;