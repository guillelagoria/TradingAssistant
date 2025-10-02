import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Download, FileBarChart, Zap, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/store/tradeStore';
import { useActiveAccount } from '@/store/accountStore';
import {
  HeroMetrics,
  AnimatedPnLChart,
  AnimatedDailyPnLChart,
  MAEMFEStatsCard,
  PerformanceStats,
} from '@/components/dashboard';
import { ExportDialog } from '@/components/export';
import TradeOptimizationInsights from '@/components/optimization/TradeOptimizationInsights';

function Dashboard() {
  const navigate = useNavigate();
  const { fetchTrades, refreshStats, trades, stats, refreshTradesForAccount } = useTradeStore();
  const activeAccount = useActiveAccount();
  
  // Refs for chart elements to capture for PDF export
  const pnlChartRef = useRef<HTMLDivElement>(null);
  const dailyPnlChartRef = useRef<HTMLDivElement>(null);
  const efficiencyChartRef = useRef<HTMLDivElement>(null);

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
    if (dailyPnlChartRef.current) elements.push(dailyPnlChartRef.current);
    if (efficiencyChartRef.current) elements.push(efficiencyChartRef.current);

    return elements;
  };

  return (
    <div className="min-h-screen pb-8">
      {/* ===== HEADER SECTION ===== */}
      <div className="flex items-start justify-between pb-4 mb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trading performance overview and analytics
          </p>
        </div>

        {/* Export Actions */}
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

      {/* ===== HERO METRICS SECTION ===== */}
      <section className="mb-8">
        <HeroMetrics />
      </section>

      {/* ===== PRIMARY CHARTS SECTION ===== */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main P&L Chart - Takes 2/3 width on desktop */}
          <div className="lg:col-span-2" ref={pnlChartRef}>
            <AnimatedPnLChart height={450} />
          </div>

          {/* Performance Stats - Takes 1/3 width on desktop */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <PerformanceStats />
          </div>
        </div>
      </section>

      {/* ===== MAE/MFE ANALYTICS SECTION ===== */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Execution Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Maximum Adverse/Favorable Excursion metrics
          </p>
        </div>
        <MAEMFEStatsCard />
      </section>

      {/* ===== SECONDARY CHARTS SECTION ===== */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Daily Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track your day-to-day trading results
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div ref={dailyPnlChartRef}>
            <AnimatedDailyPnLChart height={400} days={21} />
          </div>
        </div>
      </section>

      {/* ===== TRADE OPTIMIZATION SECTION ===== */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Trade Optimization Insights</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Data-driven recommendations to improve your trading performance
          </p>
        </div>

        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between group hover:bg-accent">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-semibold">View Insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Optimization
                </Badge>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <TradeOptimizationInsights />
          </CollapsibleContent>
        </Collapsible>
      </section>
    </div>
  );
}

export default Dashboard;