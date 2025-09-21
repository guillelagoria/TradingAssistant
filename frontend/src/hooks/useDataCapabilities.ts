import { useState, useEffect } from 'react';
import { DataCapabilities, AdaptiveStats } from '../types/account';
import { dataCapabilitiesService } from '../services/dataCapabilities.service';

interface UseDataCapabilitiesReturn {
  capabilities: DataCapabilities | null;
  adaptiveStats: AdaptiveStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  checkCapability: (analysisType: 'basic' | 'efficiency' | 'timing' | 'strategy') => Promise<boolean>;
}

export const useDataCapabilities = (accountId: string | null): UseDataCapabilitiesReturn => {
  const [capabilities, setCapabilities] = useState<DataCapabilities | null>(null);
  const [adaptiveStats, setAdaptiveStats] = useState<AdaptiveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapabilities = async () => {
    if (!accountId) return;

    setLoading(true);
    setError(null);

    try {
      const [capabilitiesData, adaptiveStatsData] = await Promise.all([
        dataCapabilitiesService.getAccountCapabilities(accountId),
        dataCapabilitiesService.getAdaptiveAccountStats(accountId)
      ]);

      setCapabilities(capabilitiesData);
      setAdaptiveStats(adaptiveStatsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch capabilities';
      setError(errorMessage);
      console.error('Error fetching data capabilities:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCapability = async (analysisType: 'basic' | 'efficiency' | 'timing' | 'strategy'): Promise<boolean> => {
    if (!accountId) return false;

    try {
      return await dataCapabilitiesService.checkAnalysisCapability(accountId, analysisType);
    } catch (err) {
      console.error('Error checking capability:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchCapabilities();
  }, [accountId]);

  return {
    capabilities,
    adaptiveStats,
    loading,
    error,
    refetch: fetchCapabilities,
    checkCapability
  };
};

// Hook for simplified capability checks
export const useCapabilityCheck = (
  accountId: string | null,
  analysisType: 'basic' | 'efficiency' | 'timing' | 'strategy'
) => {
  const [hasCapability, setHasCapability] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setHasCapability(null);
      return;
    }

    setLoading(true);
    dataCapabilitiesService
      .checkAnalysisCapability(accountId, analysisType)
      .then(setHasCapability)
      .catch(() => setHasCapability(false))
      .finally(() => setLoading(false));
  }, [accountId, analysisType]);

  return { hasCapability, loading };
};

// Hook for getting adaptive features flags
export const useAdaptiveFeatures = (accountId: string | null) => {
  const { adaptiveStats, loading, error } = useDataCapabilities(accountId);

  return {
    features: adaptiveStats?.adaptiveFeatures || {
      showAdvancedMetrics: false,
      showEfficiencyAnalysis: false,
      showTimingAnalysis: false,
      showStrategyBreakdown: false
    },
    loading,
    error
  };
};