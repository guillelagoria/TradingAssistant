import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import {
  generateWinRateData,
  formatPercentage,
  WinRateData,
} from '@/utils/chartHelpers';

interface WinRateChartProps {
  height?: number;
  className?: string;
}

const WinRateChart: React.FC<WinRateChartProps> = ({ height = 300, className }) => {
  const { trades } = useTradeStore();
  
  const chartData = generateWinRateData(trades);
  const isEmpty = chartData.length === 1 && chartData[0].name === 'No Data';
  
  // Calculate overall win rate for display
  const totalTrades = chartData.reduce((sum, item) => sum + item.count, 0);
  const winRate = isEmpty ? 0 : 
    chartData.find(item => item.name === 'Wins')?.percentage || 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as WinRateData;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-medium text-foreground">
              {data.name}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Count:</span>
            <span className="text-xs font-bold text-foreground">
              {data.count} trades
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Percentage:</span>
            <span className="text-xs font-bold text-foreground">
              {formatPercentage(data.percentage)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Custom label component for the pie slices
  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {formatPercentage(percent * 100)}
      </text>
    );
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.value}: {entry.payload.count}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 opacity-20">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-full h-full"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <p className="text-sm font-medium">No completed trades yet</p>
              <p className="text-xs mt-1">
                Close some trades to see your win rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">Win Rate</CardTitle>
          <div className="text-right">
            <div className={`text-sm font-bold ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(winRate)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalTrades} trades
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={Math.min(height * 0.35, 100)}
              innerRadius={Math.min(height * 0.2, 60)}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
          {chartData
            .filter(item => item.name !== 'No Data')
            .map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold" style={{ color: item.color }}>
                  {item.count}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.name}
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WinRateChart;