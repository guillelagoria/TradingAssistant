import axios from 'axios';
import { OptimizationInsights } from '../types/optimization';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
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

export const optimizationService = {
  /**
   * Get optimization insights for all user trades or specific account
   */
  async getOptimizationInsights(accountId?: string): Promise<OptimizationInsights> {
    const params = accountId ? { accountId } : {};
    const response = await apiClient.get('/optimization/insights', { params });
    return response.data.data;
  },

  /**
   * Get optimization insights for specific trades
   */
  async getCustomOptimizationInsights(
    tradeIds?: string[],
    accountId?: string
  ): Promise<OptimizationInsights> {
    const response = await apiClient.post('/optimization/insights/custom', {
      tradeIds,
      accountId
    });
    return response.data.data;
  }
};
