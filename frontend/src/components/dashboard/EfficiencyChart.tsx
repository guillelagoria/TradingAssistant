import React from 'react';
import {
  ScatterChart,
  Scatter,
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
  generateEfficiencyData,
  formatCurrency,
  formatPercentage,
  CHART_COLORS,
  getResultColor,
  EfficiencyPoint,
} from '@/utils/chartHelpers';
import { TradeResult } from '@/types';

interface EfficiencyChartProps {
  height?: number;
  className?: string;
}

const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ height = 300, className }) => {
  const { trades } = useTradeStore();
  
  const chartData = generateEfficiencyData(trades);
  const isEmpty = chartData.length === 0;

  // Separate data by trade result for different scatter series
  const winTrades = chartData.filter(trade => trade.result === TradeResult.WIN);
  const lossTrades = chartData.filter(trade => trade.result === TradeResult.LOSS);
  const breakevenTrades = chartData.filter(trade => trade.result === TradeResult.BREAKEVEN);

  // Calculate average efficiency
  const avgEfficiency = isEmpty ? 0 : 
    chartData.reduce((sum, trade) => sum + trade.efficiency, 0) / chartData.length;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as EfficiencyPoint;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-medium text-foreground">
              {data.symbol}
            </span>
            <span className="text-xs text-muted-foreground">
              {data.formattedDate}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">P&L:</span>
            <span className={`text-xs font-bold ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.pnl)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Efficiency:</span>
            <span className="text-xs font-bold text-foreground">
              {formatPercentage(data.efficiency)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">R-Multiple:</span>
            <span className="text-xs font-bold text-foreground">
              {data.rMultiple.toFixed(2)}R
            </span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Result:</span>
            <span className={`text-xs font-bold capitalize ${
              data.result === TradeResult.WIN ? 'text-green-600' :
              data.result === TradeResult.LOSS ? 'text-red-600' : 'text-gray-600'
            }`}>
              {data.result.toLowerCase()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isEmpty) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Trade Efficiency</CardTitle>
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
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </div>
              <p className="text-sm font-medium">No trade data yet</p>
              <p className="text-xs mt-1">
                Complete trades with max favorable/adverse prices to see efficiency analysis
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
          <CardTitle className="text-base font-semibold">Trade Efficiency</CardTitle>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">
              {formatPercentage(avgEfficiency)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Efficiency
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={CHART_COLORS.grid}
              opacity={0.5}
            />
            <XAxis
              type="number"
              dataKey="pnl"
              domain={['dataMin - 50', 'dataMax + 50']}
              fontSize={12}
              stroke={CHART_COLORS.text}
              opacity={0.7}
              tickFormatter={(value) => formatCurrency(value)}
              name="P&L"
            />
            <YAxis
              type="number"
              dataKey="efficiency"
              domain={[0, 100]}
              fontSize={12}
              stroke={CHART_COLORS.text}
              opacity={0.7}
              tickFormatter={(value) => `${value}%`}
              name="Efficiency"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines */}
            <ReferenceLine 
              x={0} 
              stroke={CHART_COLORS.neutral}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <ReferenceLine 
              y={avgEfficiency} 
              stroke={CHART_COLORS.primary}
              strokeDasharray="2 2"
              opacity={0.7}
            />
            
            {/* Win trades */}
            {winTrades.length > 0 && (
              <Scatter 
                name="Wins" 
                data={winTrades} 
                fill={CHART_COLORS.profit}
                opacity={0.8}
              />
            )}
            
            {/* Loss trades */}
            {lossTrades.length > 0 && (
              <Scatter 
                name="Losses" 
                data={lossTrades} 
                fill={CHART_COLORS.loss}
                opacity={0.8}
              />
            )}
            
            {/* Breakeven trades */}
            {breakevenTrades.length > 0 && (
              <Scatter 
                name="Breakeven" 
                data={breakevenTrades} 
                fill={CHART_COLORS.neutral}
                opacity={0.8}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Statistics Summary */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {chartData.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Total Trades
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {winTrades.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Wins
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {lossTrades.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Losses
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {formatPercentage(avgEfficiency)}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg Efficiency
            </div>
          </div>
        </div>
        
        {/* Legend and Explanation */}
        <div className="mt-4">
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Wins</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Losses</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <span>Breakeven</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Efficiency = (Realized P&L / Maximum Favorable Excursion) × 100%
            <br />
            Higher efficiency means you captured more of the available move
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EfficiencyChart;