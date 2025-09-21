import axios from 'axios';
import { DataCapabilities, AdaptiveStats } from '../types/account';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CapabilityCheckResponse {
  success: boolean;
  data: {
    accountId: string;
    analysisType: string;
    hasCapability: boolean;
  };
}

class DataCapabilitiesService {
  private baseURL = `${API_BASE_URL}/api/data-capabilities`;

  /**
   * Get comprehensive data capabilities analysis for an account
   */
  async getAccountCapabilities(accountId: string): Promise<DataCapabilities> {
    try {
      const response = await axios.get(`${this.baseURL}/${accountId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching account capabilities:', error);
      throw new Error('Failed to fetch account capabilities');
    }
  }

  /**
   * Check if account has capability for specific analysis type
   */
  async checkAnalysisCapability(
    accountId: string,
    analysisType: 'basic' | 'efficiency' | 'timing' | 'strategy'
  ): Promise<boolean> {
    try {
      const response = await axios.get<CapabilityCheckResponse>(
        `${this.baseURL}/${accountId}/check`,
        { params: { analysisType } }
      );
      return response.data.data.hasCapability;
    } catch (error) {
      console.error('Error checking analysis capability:', error);
      return false;
    }
  }

  /**
   * Get capability-aware account stats with adaptive features flags
   */
  async getAdaptiveAccountStats(accountId: string): Promise<AdaptiveStats> {
    try {
      const response = await axios.get(`${this.baseURL}/${accountId}/adaptive-stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching adaptive account stats:', error);
      throw new Error('Failed to fetch adaptive account stats');
    }
  }

  /**
   * Get capability score color for UI display
   */
  getCapabilityScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Get capability score label
   */
  getCapabilityScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Basic';
    return 'Limited';
  }

  /**
   * Get data quality breakdown percentages
   */
  getDataQualityPercentages(breakdown: { basic: number; enhanced: number; complete: number }) {
    const total = breakdown.basic + breakdown.enhanced + breakdown.complete;
    if (total === 0) return { basic: 0, enhanced: 0, complete: 0 };

    return {
      basic: Math.round((breakdown.basic / total) * 100),
      enhanced: Math.round((breakdown.enhanced / total) * 100),
      complete: Math.round((breakdown.complete / total) * 100)
    };
  }

  /**
   * Get recommendation priority (higher number = higher priority)
   */
  getRecommendationPriority(type: 'upgrade' | 'import' | 'complete'): number {
    switch (type) {
      case 'import': return 3; // Highest priority - CSV import
      case 'upgrade': return 2; // Medium - feature enablement
      case 'complete': return 1; // Lower - nice-to-have
      default: return 0;
    }
  }

  /**
   * Get recommendation icon
   */
  getRecommendationIcon(type: 'upgrade' | 'import' | 'complete'): string {
    switch (type) {
      case 'import': return '📄';
      case 'upgrade': return '⚡';
      case 'complete': return '🎯';
      default: return '💡';
    }
  }

  /**
   * Check if advanced metrics should be shown based on capabilities
   */
  shouldShowAdvancedMetrics(capabilities: DataCapabilities): boolean {
    return capabilities.capabilityScore > 50 ||
           capabilities.availableMetrics.advanced.length > 2;
  }

  /**
   * Get missing metrics summary for display
   */
  getMissingMetricsSummary(missing: string[]): string {
    if (missing.length === 0) return 'All metrics available';
    if (missing.length === 1) return `${missing[0]} not available`;
    if (missing.length <= 3) return `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]} not available`;
    return `${missing.length} advanced metrics not available`;
  }

  /**
   * Format capability score for display
   */
  formatCapabilityScore(score: number): string {
    return `${score}%`;
  }

  /**
   * Check if account needs data quality upgrade
   */
  needsDataQualityUpgrade(capabilities: DataCapabilities): boolean {
    return capabilities.capabilityScore < 70 &&
           capabilities.dataQualityBreakdown.basic > capabilities.dataQualityBreakdown.complete;
  }

  /**
   * Get primary recommendation (highest priority)
   */
  getPrimaryRecommendation(recommendations: DataCapabilities['recommendations']) {
    if (recommendations.length === 0) return null;

    return recommendations.reduce((primary, current) => {
      const currentPriority = this.getRecommendationPriority(current.type);
      const primaryPriority = this.getRecommendationPriority(primary.type);
      return currentPriority > primaryPriority ? current : primary;
    });
  }
}

export const dataCapabilitiesService = new DataCapabilitiesService();