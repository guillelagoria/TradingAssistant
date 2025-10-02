import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart, Zap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import {
  AnimatedStatsCards,
  AnimatedPnLChart,
  AnimatedWinRateChart,
  AnimatedDailyPnLChart,
  AnimatedProfitFactorChart,
  AnimatedBEStatsCard,
  MAEMFEStatsCard,
} from '@/components/dashboard';
import { WhatIfAnalysis } from '@/components/analysis';
import { ExportDialog } from '@/components/export';
import TradeOptimizationInsights from '@/components/optimization/TradeOptimizationInsights';

function Dashboard() {
  const navigate = useNavigate();
  const { fetchTrades, refreshStats, trades, stats, refreshTradesForAccount } = useTradeStore();
  const activeAccount = useActiveAccount();
  
  // Refs for chart elements to capture for PDF export
  const pnlChartRef = useRef<HTMLDivElement>(null);
  const winRateChartRef = useRef<HTMLDivElement>(null);
  const dailyPnlChartRef = useRef<HTMLDivElement>(null);
  const efficiencyChartRef = useRef<HTMLDivElement>(null);
  const extendedDailyPnlChartRef = useRef<HTMLDivElement>(null);

  // Fetch trades and refresh stats on mount or when active account changes
  useEffect(() => {
    if (activeAccount) {
      refreshTradesForAccount(activeAccount.id);
    }
  }, [activeAccount, refreshTradesForAccount]);

  // Refresh stats when trades change
  useEffect(() => {
    refreshStats();
  }, [trades, refreshStats]);

  // Force refresh when the component receives focus (when navigating back from form)
  useEffect(() => {
    const handleFocus = () => {
      if (activeAccount) {
        refreshTradesForAccount(activeAccount.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeAccount, refreshTradesForAccount]);

  // Get chart elements for PDF export
  const getChartElements = (): HTMLElement[] => {
    const elements: HTMLElement[] = [];
    
    if (pnlChartRef.current) elements.push(pnlChartRef.current);
    if (winRateChartRef.current) elements.push(winRateChartRef.current);
    if (dailyPnlChartRef.current) elements.push(dailyPnlChartRef.current);
    if (efficiencyChartRef.current) elements.push(efficiencyChartRef.current);
    
    return elements;
  };

  return (
    <div className="space-y-5">
      {/* Header - Professional, Tighter */}
      <div className="flex items-start justify-between pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trading performance overview and analytics
          </p>
        </div>

        {/* Export Actions - Refined */}
        <div className="flex items-center gap-2">
          <ExportDialog
            trades={trades}
            chartElements={getChartElements()}
            defaultOptions={{
              includeStats: true,
              includeCharts: true
            }}
            trigger={
              <Button variant="outline" size="sm" className="text-xs font-semibold uppercase tracking-wider">
                <FileBarChart className="h-3.5 w-3.5 mr-2" />
                Report
              </Button>
            }
          />

          <ExportDialog
            trades={trades}
            defaultOptions={{
              format: 'csv',
              includeStats: true
            }}
            trigger={
              <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider">
                <Download className="h-3.5 w-3.5 mr-2" />
                CSV
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Stats Cards - ANIMATED VERSION */}
      <AnimatedStatsCards />

      {/* Main P&L Chart - Full Width */}
      <div ref={pnlChartRef}>
        <AnimatedPnLChart height={380} />
      </div>

      {/* Daily P&L Chart - Full Width */}
      <div ref={dailyPnlChartRef}>
        <AnimatedDailyPnLChart height={320} days={21} />
      </div>

      {/* Win Rate Chart */}
      <div ref={winRateChartRef}>
        <AnimatedWinRateChart height={280} />
      </div>

      {/* MAE/MFE Statistics */}
      <MAEMFEStatsCard />

      {/* Break-Even Analysis */}
      <AnimatedBEStatsCard
        refreshTrigger={trades.length}
        onViewDetails={() => navigate('/analysis/break-even')}
      />

      {/* Trade Optimization Insights */}
      <TradeOptimizationInsights />
    </div>
  );
}

export default Dashboard;