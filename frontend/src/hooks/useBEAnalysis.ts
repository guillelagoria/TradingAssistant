/**
 * Hook for Break-Even Analysis data and operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BEAnalysisMetrics,
  BEOptimizationScenario,
  BERecommendation,
  BEStatsByStrategy
} from '@/types/beAnalysis';
import { BEAnalysisService } from '@/services/beAnalysisService';
import { useActiveAccount } from '@/store/accountStore';

interface BEAnalysisData {
  shouldUseBE: boolean;
  recommendedStrategy: string;
  optimalBELevel: number;
  confidence: number;
  keyInsights: string[];
  topScenario: BEOptimizationScenario;
  portfolioMetrics: BEAnalysisMetrics;
  allScenarios: BEOptimizationScenario[];
}

interface UseBEAnalysisReturn {
  // Data
  beAnalysis: BEAnalysisData | null;
  beMetrics: BEAnalysisMetrics | null;
  beScenarios: BEOptimizationScenario[];
  strategiesStats: BEStatsByStrategy[];

  // Loading states
  isLoadingAnalysis: boolean;
  isLoadingMetrics: boolean;
  isLoadingScenarios: boolean;

  // Error states
  analysisError: string | null;
  metricsError: string | null;
  scenariosError: string | null;

  // Actions
  refreshAnalysis: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshScenarios: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export function useBEAnalysis(): UseBEAnalysisReturn {
  const activeAccount = useActiveAccount();

  // Data state
  const [beAnalysis, setBEAnalysis] = useState<BEAnalysisData | null>(null);
  const [beMetrics, setBEMetrics] = useState<BEAnalysisMetrics | null>(null);
  const [beScenarios, setBEScenarios] = useState<BEOptimizationScenario[]>([]);
  const [strategiesStats, setStrategiesStats] = useState<BEStatsByStrategy[]>([]);

  // Loading states
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(false);

  // Error states
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [scenariosError, setScenariosError] = useState<string | null>(null);

  // Fetch BE analysis and recommendations
  const fetchBEAnalysis = useCallback(async () => {
    if (!activeAccount) {
      setBEAnalysis(null);
      return;
    }

    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    try {
      const result = await BEAnalysisService.getBERecommendations(activeAccount.id);
      setBEAnalysis(result);
    } catch (error) {
      console.error('Error fetching BE analysis:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [activeAccount]);

  // Fetch BE metrics only
  const fetchBEMetrics = useCallback(async () => {
    if (!activeAccount) {
      setBEMetrics(null);
      return;
    }

    setIsLoadingMetrics(true);
    setMetricsError(null);

    try {
      const result = await BEAnalysisService.getBEMetrics(activeAccount.id);
      setBEMetrics(result);
    } catch (error) {
      console.error('Error fetching BE metrics:', error);
      setMetricsError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [activeAccount]);

  // Fetch BE scenarios
  const fetchBEScenarios = useCallback(async () => {
    if (!activeAccount) {
      setBEScenarios([]);
      return;
    }

    setIsLoadingScenarios(true);
    setScenariosError(null);

    try {
      const result = await BEAnalysisService.getBEScenarios(activeAccount.id);
      setBEScenarios(result);
    } catch (error) {
      console.error('Error fetching BE scenarios:', error);
      setScenariosError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoadingScenarios(false);
    }
  }, [activeAccount]);

  // Refresh functions
  const refreshAnalysis = useCallback(async () => {
    await fetchBEAnalysis();
  }, [fetchBEAnalysis]);

  const refreshMetrics = useCallback(async () => {
    await fetchBEMetrics();
  }, [fetchBEMetrics]);

  const refreshScenarios = useCallback(async () => {
    await fetchBEScenarios();
  }, [fetchBEScenarios]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchBEAnalysis(),
      fetchBEMetrics(),
      fetchBEScenarios()
    ]);
  }, [fetchBEAnalysis, fetchBEMetrics, fetchBEScenarios]);

  // Load initial data when active account changes
  useEffect(() => {
    if (activeAccount) {
      refreshAll();
    }
  }, [activeAccount, refreshAll]);

  return {
    // Data
    beAnalysis,
    beMetrics,
    beScenarios,
    strategiesStats,

    // Loading states
    isLoadingAnalysis,
    isLoadingMetrics,
    isLoadingScenarios,

    // Error states
    analysisError,
    metricsError,
    scenariosError,

    // Actions
    refreshAnalysis,
    refreshMetrics,
    refreshScenarios,
    refreshAll
  };
}

// Hook for simplified BE metrics (commonly used in dashboard)
export function useBEMetrics() {
  const { beMetrics, isLoadingMetrics, metricsError, refreshMetrics } = useBEAnalysis();

  const simplifiedMetrics = beMetrics ? {
    totalTrades: beMetrics.totalTrades || 0,
    tradesWithBE: beMetrics.tradesWithBE || 0,
    beSuccessRate: beMetrics.beSuccessRate || 0,
    avgProfitCaptureRate: beMetrics.avgProfitCaptureRate || 0,
    totalProtectedProfit: beMetrics.totalProtectedProfit || 0,
    totalMissedProfit: beMetrics.totalMissedProfit || 0,
    netBEImpact: beMetrics.netBEImpact || 0,
    recommendedStrategy: beMetrics.recommendedStrategy || 'insufficient-data'
  } : null;

  return {
    metrics: simplifiedMetrics,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refresh: refreshMetrics
  };
}

// Hook for BE recommendations (used in analysis pages)
export function useBERecommendations() {
  const { beAnalysis, isLoadingAnalysis, analysisError, refreshAnalysis } = useBEAnalysis();

  const recommendations = beAnalysis ? {
    shouldUseBE: beAnalysis.shouldUseBE,
    recommendedStrategy: beAnalysis.recommendedStrategy,
    optimalBELevel: beAnalysis.optimalBELevel,
    confidence: beAnalysis.confidence,
    keyInsights: beAnalysis.keyInsights,
    topScenario: beAnalysis.topScenario
  } : null;

  return {
    recommendations,
    isLoading: isLoadingAnalysis,
    error: analysisError,
    refresh: refreshAnalysis
  };
}

// Hook for BE scenarios (used in optimization pages)
export function useBEScenarios() {
  const { beScenarios, isLoadingScenarios, scenariosError, refreshScenarios } = useBEAnalysis();

  return {
    scenarios: beScenarios,
    topScenarios: beScenarios.slice(0, 3), // Top 3 scenarios
    isLoading: isLoadingScenarios,
    error: scenariosError,
    refresh: refreshScenarios
  };
}