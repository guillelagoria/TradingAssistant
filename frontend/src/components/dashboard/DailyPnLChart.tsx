import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import {
  generateDailyPnLData,
  formatCurrency,
  CHART_COLORS,
  getValueColor,
  DailyPnLPoint,
} from '@/utils/chartHelpers';

interface DailyPnLChartProps {
  height?: number;
  className?: string;
  days?: number; // Number of recent days to show
}

const DailyPnLChart: React.FC<DailyPnLChartProps> = ({ 
  height = 300, 
  className,
  days = 30 
}) => {
  const { trades } = useTradeStore();
  
  const allDailyData = generateDailyPnLData(trades);
  
  // Show only the most recent days
  const chartData = allDailyData.slice(-days);
  const isEmpty = chartData.length === 0;

  // Calculate statistics
  const totalDays = chartData.length;
  const profitableDays = chartData.filter(day => day.pnl > 0).length;
  const totalPnL = chartData.reduce((sum, day) => sum + day.pnl, 0);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as DailyPnLPoint;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-2">
          {data.formattedDate}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Daily P&L:</span>
            <span className={`text-xs font-bold ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Total Trades:</span>
            <span className="text-xs font-medium text-foreground">
              {data.tradeCount}
            </span>
          </div>
          {data.winTrades > 0 && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-muted-foreground">Wins:</span>
              <span className="text-xs font-medium text-green-600">
                {data.winTrades}
              </span>
            </div>
          )}
          {data.lossTrades > 0 && (
            <div className="flex justify-between items-center gap-4">
              <span className="text-xs text-muted-foreground">Losses:</span>
              <span className="text-xs font-medium text-red-600">
                {data.lossTrades}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom bar component for dynamic coloring
  const CustomBar = (props: any) => {
    const { payload } = props;
    if (!payload) return <Bar {...props} />;
    
    return (
      <Bar 
        {...props} 
        fill={getValueColor(payload.pnl)}
        opacity={0.8}
        className="hover:opacity-100 transition-opacity"
      />
    );
  };

  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily P&L</CardTitle>
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="9" />
                  <rect x="14" y="7" width="3" height="9" />
                </svg>
              </div>
              <p className="text-sm font-medium">No daily data yet</p>
              <p className="text-xs mt-1">
                Complete some trades to see your daily performance
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
          <CardTitle className="text-base font-semibold">Daily P&L</CardTitle>
          <div className="text-right">
            <div className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </div>
            <div className="text-xs text-muted-foreground">
              Last {Math.min(days, totalDays)} days
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={CHART_COLORS.grid}
              opacity={0.5}
            />
            <XAxis
              dataKey="formattedDate"
              fontSize={12}
              stroke={CHART_COLORS.text}
              opacity={0.7}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={Math.ceil(chartData.length / 8)} // Show roughly 8 labels max
            />
            <YAxis
              fontSize={12}
              stroke={CHART_COLORS.text}
              opacity={0.7}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Zero line reference */}
            <ReferenceLine 
              y={0} 
              stroke={CHART_COLORS.neutral}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getValueColor(entry.pnl)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {totalDays}
            </div>
            <div className="text-xs text-muted-foreground">
              Trading Days
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {profitableDays}
            </div>
            <div className="text-xs text-muted-foreground">
              Profitable Days
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {totalDays > 0 ? Math.round((profitableDays / totalDays) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">
              Success Rate
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Profitable Day</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Loss Day</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyPnLChart;