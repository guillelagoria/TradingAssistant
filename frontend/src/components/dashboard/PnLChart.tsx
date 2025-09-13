import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTradeStore } from '@/store/tradeStore';
import {
  generateCumulativePnLData,
  formatCurrency,
  CHART_COLORS,
  CumulativePnLPoint,
} from '@/utils/chartHelpers';

interface PnLChartProps {
  height?: number;
  className?: string;
}

const PnLChart: React.FC<PnLChartProps> = ({ height = 300, className }) => {
  const { trades } = useTradeStore();
  
  const chartData = generateCumulativePnLData(trades);
  const isEmpty = chartData.length === 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as CumulativePnLPoint;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground mb-2">
          {data.formattedDate}
        </p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Trade P&L:</span>
            <span className={`text-xs font-medium ${data.tradePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.tradePnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Cumulative P&L:</span>
            <span className={`text-xs font-bold ${data.cumulativePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.cumulativePnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Total Trades:</span>
            <span className="text-xs font-medium text-foreground">
              {data.tradeCount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Custom dot component that changes color based on trade result
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    
    const dotColor = payload.tradePnl >= 0 ? CHART_COLORS.profit : CHART_COLORS.loss;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={dotColor}
        stroke="#ffffff"
        strokeWidth={2}
        className="opacity-80 hover:opacity-100 transition-opacity"
      />
    );
  };

  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">P&L Evolution</CardTitle>
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
                  <path d="M3 12l2-2 4 4L18 6l2 2" />
                </svg>
              </div>
              <p className="text-sm font-medium">No closed trades yet</p>
              <p className="text-xs mt-1">
                Complete some trades to see your P&L evolution
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const finalPnL = chartData[chartData.length - 1]?.cumulativePnl || 0;
  const isProfit = finalPnL >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold">P&L Evolution</CardTitle>
          <div className="text-right">
            <div className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(finalPnL)}
            </div>
            <div className="text-xs text-muted-foreground">
              Total P&L
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
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
              interval="preserveStartEnd"
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
            
            <Line
              type="monotone"
              dataKey="cumulativePnl"
              stroke={isProfit ? CHART_COLORS.profit : CHART_COLORS.loss}
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{
                r: 6,
                fill: isProfit ? CHART_COLORS.profit : CHART_COLORS.loss,
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center mt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Profitable Trade</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Loss Trade</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PnLChart;