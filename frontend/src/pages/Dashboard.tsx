import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileBarChart } from 'lucide-react';
import { useTradeStore } from '@/store/tradeStore';
import {
  StatsCards,
  PnLChart,
  WinRateChart,
  DailyPnLChart,
  EfficiencyChart,
} from '@/components/dashboard';
import { WhatIfAnalysis } from '@/components/analysis';
import { ExportDialog } from '@/components/export';

function Dashboard() {
  const { fetchTrades, refreshStats, trades, stats } = useTradeStore();
  
  // Refs for chart elements to capture for PDF export
  const pnlChartRef = useRef<HTMLDivElement>(null);
  const winRateChartRef = useRef<HTMLDivElement>(null);
  const dailyPnlChartRef = useRef<HTMLDivElement>(null);
  const efficiencyChartRef = useRef<HTMLDivElement>(null);
  const extendedDailyPnlChartRef = useRef<HTMLDivElement>(null);

  // Fetch trades and refresh stats on mount
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Refresh stats when trades change
  useEffect(() => {
    refreshStats();
  }, [trades, refreshStats]);

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
      
      {/* Stats Cards */}
      <StatsCards />
      
      {/* Main Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* P&L Evolution Chart */}
        <div ref={pnlChartRef}>
          <PnLChart height={350} className="lg:col-span-2" />
        </div>
      </div>
      
      {/* Secondary Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Win Rate Donut Chart */}
        <div ref={winRateChartRef}>
          <WinRateChart height={300} />
        </div>
        
        {/* Daily P&L Bar Chart */}
        <div ref={dailyPnlChartRef}>
          <DailyPnLChart height={300} days={21} />
        </div>
        
        {/* Efficiency Scatter Plot */}
        <div ref={efficiencyChartRef}>
          <EfficiencyChart height={300} />
        </div>
      </div>
      
      {/* What-If Analysis Section */}
      <div className="space-y-6">
        <WhatIfAnalysis />
      </div>
      
      {/* Additional Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Extended Daily P&L for longer period */}
        <DailyPnLChart 
          height={280} 
          days={90} 
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}

export default Dashboard;