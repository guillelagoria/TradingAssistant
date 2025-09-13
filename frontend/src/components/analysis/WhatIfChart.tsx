import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Legend,
  ComposedChart
} from 'recharts';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import { WhatIfAnalysisResult, getComparisonChartData } from '@/utils/whatIfCalculations';

interface WhatIfChartProps {
  analysisResult: WhatIfAnalysisResult;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border rounded-lg p-3 shadow-lg">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.dataKey}:</span>
          <span className="font-mono font-bold">
            {entry.dataKey.includes('PnL') || entry.dataKey.includes('improvement') 
              ? `$${entry.value.toFixed(2)}` 
              : entry.value.toFixed(1)
            }
          </span>
        </div>
      ))}
    </div>
  );
}

export function WhatIfChart({ analysisResult }: WhatIfChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'composed'>('bar');
  
  const comparisonData = getComparisonChartData(analysisResult);
  
  // Prepare data for different chart types
  const barData = comparisonData.map(item => ({
    scenario: item.scenario,
    'Original P&L': item.originalPnL,
    'Improved P&L': item.improvedPnL,
    'Improvement': item.improvement,
    color: item.color
  }));

  const lineData = analysisResult.scenarios.map((result, index) => ({
    scenario: result.scenario.name,
    winRateImprovement: result.improvement.winRateImprovement,
    profitFactorImprovement: result.improvement.profitFactorImprovement,
    pnlImprovement: result.improvement.totalPnlImprovement,
    color: result.scenario.color
  }));

  const pieData = analysisResult.scenarios
    .filter(s => s.improvement.totalPnlImprovement > 0)
    .map(result => ({
      name: result.scenario.name,
      value: result.improvement.totalPnlImprovement,
      color: result.scenario.color
    }));

  const composedData = analysisResult.scenarios.map(result => ({
    scenario: result.scenario.name.split(' ')[0], // Shortened for better display
    pnlImprovement: result.improvement.totalPnlImprovement,
    winRateImprovement: result.improvement.winRateImprovement,
    profitFactor: result.improvedStats.profitFactor,
    color: result.scenario.color
  }));

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="scenario" 
          angle={-45}
          textAnchor="end"
          height={100}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Original P&L" fill="#94a3b8" name="Original P&L" />
        <Bar dataKey="Improved P&L" name="Improved P&L">
          {barData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={lineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="scenario" 
          angle={-45}
          textAnchor="end"
          height={100}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="winRateImprovement" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Win Rate Improvement (%)"
        />
        <Line 
          type="monotone" 
          dataKey="profitFactorImprovement" 
          stroke="#10B981" 
          strokeWidth={2}
          dot={{ r: 4 }}
          name="Profit Factor Improvement"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <div className="h-400 flex items-center justify-center">
      {pieData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-muted-foreground">
          <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No positive improvements to display</p>
        </div>
      )}
    </div>
  );

  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={composedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="scenario" fontSize={12} />
        <YAxis yAxisId="left" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar yAxisId="left" dataKey="pnlImprovement" name="P&L Improvement ($)">
          {composedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
          ))}
        </Bar>
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="winRateImprovement" 
          stroke="#F59E0B" 
          strokeWidth={3}
          dot={{ r: 5, fill: '#F59E0B' }}
          name="Win Rate Improvement (%)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'composed':
        return renderComposedChart();
      default:
        return renderBarChart();
    }
  };

  const getChartDescription = () => {
    switch (chartType) {
      case 'bar':
        return 'Compare original vs improved P&L across all scenarios';
      case 'line':
        return 'Track improvement trends across different performance metrics';
      case 'pie':
        return 'Distribution of positive improvements by scenario';
      case 'composed':
        return 'Combined view of P&L improvement and win rate changes';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Visualization
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="bar" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line" className="text-xs">
                  <LineChartIcon className="h-3 w-3 mr-1" />
                  Line
                </TabsTrigger>
                <TabsTrigger value="pie" className="text-xs">
                  <PieChartIcon className="h-3 w-3 mr-1" />
                  Pie
                </TabsTrigger>
                <TabsTrigger value="composed" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Mix
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {getChartDescription()}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="w-full">
            {renderChart()}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 justify-center pt-4 border-t">
            {analysisResult.scenarios.slice(0, 6).map(result => (
              <div key={result.scenario.id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: result.scenario.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {result.scenario.name}
                </span>
                <Badge 
                  variant={result.improvement.totalPnlImprovement > 0 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {result.improvement.totalPnlImprovement > 0 ? '+' : ''}
                  ${result.improvement.totalPnlImprovement.toFixed(0)}
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Chart Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {analysisResult.scenarios.filter(s => s.improvement.totalPnlImprovement > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Positive Scenarios</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                ${Math.max(...analysisResult.scenarios.map(s => s.improvement.totalPnlImprovement)).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Best Improvement</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {analysisResult.scenarios.filter(s => Math.abs(s.improvement.totalPnlImprovementPercent) > 10).length}
              </div>
              <div className="text-xs text-muted-foreground">High Impact (&gt;10%)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}