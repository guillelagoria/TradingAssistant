import { useState, useEffect, useCallback } from 'react';
import { marketService, MarketInfo } from '@/services/marketService';

interface UseMarketDataReturn {
  markets: MarketInfo[];
  loading: boolean;
  error: string | null;
  refreshMarkets: () => Promise<void>;
  getMarket: (symbol: string) => MarketInfo | undefined;
}

export function useMarketData(): UseMarketDataReturn {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const marketData = await marketService.getMarketsInfo();
      setMarkets(marketData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load markets';
      setError(errorMessage);
      console.error('Error loading markets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getMarket = useCallback((symbol: string): MarketInfo | undefined => {
    return markets.find(market =>
      market.symbol === symbol ||
      market.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }, [markets]);

  // Load markets on mount
  useEffect(() => {
    refreshMarkets();
  }, [refreshMarkets]);

  return {
    markets,
    loading,
    error,
    refreshMarkets,
    getMarket,
  };
}

interface UseMarketDetailsReturn {
  marketInfo: MarketInfo | null;
  loading: boolean;
  error: string | null;
  refreshMarket: () => Promise<void>;
}

export function useMarketDetails(symbol?: string): UseMarketDetailsReturn {
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMarket = useCallback(async () => {
    if (!symbol) {
      setMarketInfo(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await marketService.getMarketInfo(symbol);
      setMarketInfo(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load market details';
      setError(errorMessage);
      setMarketInfo(null);
      console.error('Error loading market details:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Load market details when symbol changes
  useEffect(() => {
    refreshMarket();
  }, [refreshMarket]);

  return {
    marketInfo,
    loading,
    error,
    refreshMarket,
  };
}