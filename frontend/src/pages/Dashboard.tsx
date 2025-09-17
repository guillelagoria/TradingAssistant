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
} from '@/components/dashboard';
import { WhatIfAnalysis } from '@/components/analysis';
import { ExportDialog } from '@/components/export';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your trading performance and recent activity.
          </p>
        </div>
        
        {/* Export Actions */}
        <div className="flex items-center space-x-2">
          <ExportDialog
            trades={trades}
            chartElements={getChartElements()}
            defaultOptions={{
              includeStats: true,
              includeCharts: true
            }}
            trigger={
              <Button variant="outline">
                <FileBarChart className="h-4 w-4 mr-2" />
                Export Report
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
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            }
          />
        </div>
      </div>
      
      {/* Stats Cards - ANIMATED VERSION */}
      <AnimatedStatsCards />

      {/* Main P&L Chart - Full Width */}
      <div ref={pnlChartRef}>
        <AnimatedPnLChart height={400} />
      </div>
      
      {/* Daily P&L Chart - Full Width */}
      <div className="space-y-6">
        <div ref={dailyPnlChartRef}>
          <AnimatedDailyPnLChart height={350} days={21} />
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Win Rate Donut Chart */}
        <div ref={winRateChartRef}>
          <AnimatedWinRateChart height={300} />
        </div>

        {/* Profit Factor Chart */}
        <div ref={efficiencyChartRef}>
          <AnimatedProfitFactorChart height={300} />
        </div>
      </div>

      {/* Break-Even Analysis Section */}
      <div className="space-y-6">
        <AnimatedBEStatsCard
          refreshTrigger={trades.length}
          onViewDetails={() => navigate('/analysis/break-even')}
        />
      </div>

      {/* What-If Analysis Section */}
      <div className="space-y-6">
        <WhatIfAnalysis />
      </div>
      
      {/* Additional Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extended Daily P&L for longer period */}
        <AnimatedDailyPnLChart
          height={280}
          days={90}
          className="lg:col-span-2"
        />
      </div>

      {/* Floating Action Button - Quick Trade Entry */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => navigate('/trades/wizard')}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 hover:scale-105"
        >
          <div className="flex flex-col items-center">
            <Zap className="h-5 w-5" />
            <Plus className="h-3 w-3 -mt-1" />
          </div>
          <span className="sr-only">Quick Trade Entry</span>
        </Button>

        {/* Tooltip */}
        <div className="absolute bottom-16 right-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Quick Trade Entry
        </div>
      </div>
    </div>
  );
}

export default Dashboard;