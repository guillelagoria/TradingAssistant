import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useTradeStore } from '@/store/tradeStore';

interface PortfolioData {
  symbolAllocation: Array<{ symbol: string; value: number; trades: number; pnl: number }>;
  strategyAllocation: Array<{ strategy: string; value: number; trades: number; pnl: number }>;
  monthlyPerformance: Array<{ month: string; pnl: number; trades: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Portfolio() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const { trades, loading } = useTradeStore();

  useEffect(() => {
    if (trades.length > 0) {
      // Calculate symbol allocation
      const symbolMap = new Map<string, { value: number; trades: number; pnl: number }>();
      trades.forEach(trade => {
        const current = symbolMap.get(trade.symbol) || { value: 0, trades: 0, pnl: 0 };
        symbolMap.set(trade.symbol, {
          value: current.value + (trade.positionSize || trade.entryPrice * trade.quantity),
          trades: current.trades + 1,
          pnl: current.pnl + (trade.netPnl || 0)
        });
      });

      // Calculate strategy allocation
      const strategyMap = new Map<string, { value: number; trades: number; pnl: number }>();
      trades.forEach(trade => {
        const strategy = trade.strategy || 'Unknown';
        const current = strategyMap.get(strategy) || { value: 0, trades: 0, pnl: 0 };
        strategyMap.set(strategy, {
          value: current.value + (trade.positionSize || trade.entryPrice * trade.quantity),
          trades: current.trades + 1,
          pnl: current.pnl + (trade.netPnl || 0)
        });
      });

      // Calculate monthly performance
      const monthlyMap = new Map<string, { pnl: number; trades: number }>();
      trades.forEach(trade => {
        const monthKey = trade.entryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const current = monthlyMap.get(monthKey) || { pnl: 0, trades: 0 };
        monthlyMap.set(monthKey, {
          pnl: current.pnl + (trade.netPnl || 0),
          trades: current.trades + 1
        });
      });

      setPortfolioData({
        symbolAllocation: Array.from(symbolMap.entries()).map(([symbol, data]) => ({ 
          symbol, 
          ...data 
        })).sort((a, b) => b.value - a.value),
        strategyAllocation: Array.from(strategyMap.entries()).map(([strategy, data]) => ({ 
          strategy, 
          ...data 
        })).sort((a, b) => b.value - a.value),
        monthlyPerformance: Array.from(monthlyMap.entries()).map(([month, data]) => ({ 
          month, 
          ...data 
        })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      });
    }
  }, [trades]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData || trades.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Asset allocation and portfolio performance overview
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Portfolio Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No trades found. Add some trades to see your portfolio allocation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalValue = portfolioData.symbolAllocation.reduce((sum, item) => sum + item.value, 0);
  const totalPnL = portfolioData.symbolAllocation.reduce((sum, item) => sum + item.pnl, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
            <p className="text-muted-foreground">
              Asset allocation and portfolio performance overview
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-lg font-bold">${totalValue.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total P&L</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${
                totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalPnL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                ${totalPnL.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Symbol Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Symbol Allocation</CardTitle>
              <CardDescription>Portfolio distribution by trading symbols</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData.symbolAllocation.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ symbol, percent }) => `${symbol} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioData.symbolAllocation.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {portfolioData.symbolAllocation.slice(0, 5).map((item, index) => (
                  <div key={item.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{item.symbol}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.trades} trades
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${item.value.toFixed(2)}</div>
                      <div className={`text-xs ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strategy Allocation */}
          <Card>
            <CardHeader>
              <CardTitle>Strategy Allocation</CardTitle>
              <CardDescription>Portfolio distribution by trading strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData.strategyAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ strategy, percent }) => `${strategy.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioData.strategyAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {portfolioData.strategyAllocation.map((item, index) => (
                  <div key={item.strategy} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{item.strategy.replace('_', ' ')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.trades} trades
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${item.value.toFixed(2)}</div>
                      <div className={`text-xs ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>P&L and trading activity by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioData.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="pnl" 
                    fill="#8884d8" 
                    name="P&L ($)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="trades" 
                    fill="#82ca9d" 
                    name="Number of Trades"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}