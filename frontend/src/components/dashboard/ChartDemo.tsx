import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CHART_COLORS, formatCurrency } from '@/utils/chartHelpers';

const ChartDemo: React.FC = () => {
  // Sample data for demonstration
  const samplePnLData = [
    { date: '2024-01-01', cumulativePnl: 0, tradePnl: 0, tradeCount: 0 },
    { date: '2024-01-02', cumulativePnl: 150, tradePnl: 150, tradeCount: 1 },
    { date: '2024-01-03', cumulativePnl: 80, tradePnl: -70, tradeCount: 2 },
    { date: '2024-01-04', cumulativePnl: 250, tradePnl: 170, tradeCount: 3 },
    { date: '2024-01-05', cumulativePnl: 180, tradePnl: -70, tradeCount: 4 },
    { date: '2024-01-06', cumulativePnl: 320, tradePnl: 140, tradeCount: 5 },
    { date: '2024-01-07', cumulativePnl: 450, tradePnl: 130, tradeCount: 6 },
    { date: '2024-01-08', cumulativePnl: 380, tradePnl: -70, tradeCount: 7 },
    { date: '2024-01-09', cumulativePnl: 520, tradePnl: 140, tradeCount: 8 },
    { date: '2024-01-10', cumulativePnl: 680, tradePnl: 160, tradeCount: 9 },
  ];

  const sampleWinRateData = [
    { name: 'Wins', value: 6, percentage: 66.7, count: 6, color: CHART_COLORS.profit },
    { name: 'Losses', value: 3, percentage: 33.3, count: 3, color: CHART_COLORS.loss },
  ];

  const sampleDailyData = [
    { date: '2024-01-01', formattedDate: 'Jan 01', pnl: 150, tradeCount: 1 },
    { date: '2024-01-02', formattedDate: 'Jan 02', pnl: -70, tradeCount: 1 },
    { date: '2024-01-03', formattedDate: 'Jan 03', pnl: 170, tradeCount: 1 },
    { date: '2024-01-04', formattedDate: 'Jan 04', pnl: -70, tradeCount: 1 },
    { date: '2024-01-05', formattedDate: 'Jan 05', pnl: 140, tradeCount: 1 },
    { date: '2024-01-06', formattedDate: 'Jan 06', pnl: 130, tradeCount: 1 },
    { date: '2024-01-07', formattedDate: 'Jan 07', pnl: -70, tradeCount: 1 },
    { date: '2024-01-08', formattedDate: 'Jan 08', pnl: 140, tradeCount: 1 },
    { date: '2024-01-09', formattedDate: 'Jan 09', pnl: 160, tradeCount: 1 },
  ];

  const sampleEfficiencyData = [
    { pnl: 150, efficiency: 85, symbol: 'AAPL', result: 'WIN' },
    { pnl: -70, efficiency: 45, symbol: 'TSLA', result: 'LOSS' },
    { pnl: 170, efficiency: 92, symbol: 'MSFT', result: 'WIN' },
    { pnl: -70, efficiency: 38, symbol: 'GOOGL', result: 'LOSS' },
    { pnl: 140, efficiency: 78, symbol: 'NVDA', result: 'WIN' },
    { pnl: 130, efficiency: 82, symbol: 'AMD', result: 'WIN' },
    { pnl: -70, efficiency: 42, symbol: 'META', result: 'LOSS' },
    { pnl: 140, efficiency: 88, symbol: 'NFLX', result: 'WIN' },
    { pnl: 160, efficiency: 95, symbol: 'AMZN', result: 'WIN' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Chart Demo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Preview of how charts will look with real trading data
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Demo Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            This demonstrates the professional charts that will display your actual trading data.
            Start adding trades to see your real performance!
          </div>
        </CardContent>
      </Card>

      {/* P&L Evolution Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">P&L Evolution (Demo)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={samplePnLData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.5} />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Cumulative P&L']} />
              <ReferenceLine y={0} stroke={CHART_COLORS.neutral} strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="cumulativePnl" 
                stroke={CHART_COLORS.profit} 
                strokeWidth={3}
                dot={{ fill: CHART_COLORS.profit, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid Demo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Win Rate Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Win Rate (Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sampleWinRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sampleWinRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Wins: 6</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Losses: 3</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily P&L Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Daily P&L (Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sampleDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.5} />
                <XAxis dataKey="formattedDate" fontSize={10} angle={-45} textAnchor="end" height={60} />
                <YAxis fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Daily P&L']} />
                <ReferenceLine y={0} stroke={CHART_COLORS.neutral} strokeDasharray="2 2" />
                <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                  {sampleDailyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl > 0 ? CHART_COLORS.profit : CHART_COLORS.loss} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Trade Efficiency (Demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} opacity={0.5} />
                <XAxis 
                  type="number" 
                  dataKey="pnl" 
                  fontSize={12} 
                  tickFormatter={formatCurrency}
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <YAxis 
                  type="number" 
                  dataKey="efficiency" 
                  fontSize={12} 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'pnl') return [formatCurrency(Number(value)), 'P&L'];
                    if (name === 'efficiency') return [`${value}%`, 'Efficiency'];
                    return [value, name];
                  }} 
                />
                <ReferenceLine x={0} stroke={CHART_COLORS.neutral} strokeDasharray="2 2" />
                <Scatter 
                  data={sampleEfficiencyData.filter(d => d.result === 'WIN')} 
                  fill={CHART_COLORS.profit}
                  name="Wins"
                />
                <Scatter 
                  data={sampleEfficiencyData.filter(d => d.result === 'LOSS')} 
                  fill={CHART_COLORS.loss}
                  name="Losses"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Wins</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Losses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              These charts will automatically populate with your real trading data once you start adding trades.
            </p>
            <p className="text-xs">
              The demo shows sample data with 9 trades, 66.7% win rate, and $680 total P&L.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartDemo;