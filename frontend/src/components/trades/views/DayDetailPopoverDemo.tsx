import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trade, TradeDirection, TradeStatus, TradeResult, Strategy, OrderType, Timeframe } from '@/types';
import DayDetailPopover from './DayDetailPopover';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * DayDetailPopoverDemo
 *
 * Interactive demo component showcasing the DayDetailPopover functionality
 * with sample trade data and various scenarios.
 */

// Sample trade data generator
function generateSampleTrades(date: Date, count: number): Trade[] {
  const trades: Trade[] = [];
  const symbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'];

  for (let i = 0; i < count; i++) {
    const direction = Math.random() > 0.5 ? TradeDirection.LONG : TradeDirection.SHORT;
    const entryPrice = 100 + Math.random() * 400;
    const isWin = Math.random() > 0.4; // 60% win rate
    const pnl = isWin ? Math.random() * 500 + 50 : -(Math.random() * 300 + 25);

    const trade: Trade = {
      id: `demo-${date.toISOString()}-${i}`,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      direction,
      entryPrice,
      quantity: Math.floor(Math.random() * 100) + 10,
      entryDate: new Date(date.getTime() + i * 3600000), // Space trades by hours
      orderType: OrderType.MARKET,
      exitPrice: direction === TradeDirection.LONG
        ? entryPrice + (pnl / 100)
        : entryPrice - (pnl / 100),
      exitDate: new Date(date.getTime() + (i + 1) * 3600000),
      result: pnl > 0 ? TradeResult.WIN : pnl < 0 ? TradeResult.LOSS : TradeResult.BREAKEVEN,
      stopLoss: direction === TradeDirection.LONG
        ? entryPrice * 0.98
        : entryPrice * 1.02,
      takeProfit: direction === TradeDirection.LONG
        ? entryPrice * 1.05
        : entryPrice * 0.95,
      strategy: Strategy.DAY_TRADING,
      timeframe: Timeframe.M15,
      status: TradeStatus.CLOSED,
      createdAt: new Date(),
      updatedAt: new Date(),
      pnl,
      pnlPercentage: (pnl / entryPrice) * 100,
      efficiency: Math.random() * 100,
      rMultiple: pnl / (Math.abs(entryPrice - (trade.stopLoss || entryPrice)) * 100),
      commission: 2.5,
      netPnl: pnl - 2.5,
    };

    trades.push(trade);
  }

  return trades.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
}

// Demo scenarios
const demoScenarios = [
  {
    id: 'profitable-day',
    title: 'Profitable Day',
    description: '5 trades, mostly wins',
    tradeCount: 5,
    date: new Date('2024-09-17T09:30:00'),
    forceProfit: true
  },
  {
    id: 'mixed-day',
    title: 'Mixed Results',
    description: '3 trades, wins and losses',
    tradeCount: 3,
    date: new Date('2024-09-16T09:30:00'),
    forceProfit: false
  },
  {
    id: 'busy-day',
    title: 'Busy Trading Day',
    description: '8 trades, high activity',
    tradeCount: 8,
    date: new Date('2024-09-15T09:30:00'),
    forceProfit: false
  },
  {
    id: 'single-trade',
    title: 'Single Trade',
    description: '1 trade only',
    tradeCount: 1,
    date: new Date('2024-09-14T09:30:00'),
    forceProfit: true
  },
  {
    id: 'no-trades',
    title: 'No Trades',
    description: 'Empty day',
    tradeCount: 0,
    date: new Date('2024-09-13T09:30:00'),
    forceProfit: false
  }
];

export default function DayDetailPopoverDemo() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentTrades, setCurrentTrades] = useState<Trade[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const handleScenarioClick = (scenario: typeof demoScenarios[0]) => {
    let trades = generateSampleTrades(scenario.date, scenario.tradeCount);

    // Force profit if needed
    if (scenario.forceProfit && trades.length > 0) {
      trades = trades.map(trade => ({
        ...trade,
        pnl: Math.abs(trade.pnl),
        result: TradeResult.WIN,
        netPnl: Math.abs(trade.pnl) - trade.commission
      }));
    }

    setCurrentTrades(trades);
    setCurrentDate(scenario.date);
    setSelectedScenario(scenario.id);
    setPopoverOpen(true);
  };

  const handleViewTrade = (trade: Trade) => {
    alert(`View Trade: ${trade.symbol} ${trade.direction} - P&L: $${trade.pnl.toFixed(2)}`);
  };

  const handleEditTrade = (trade: Trade) => {
    alert(`Edit Trade: ${trade.symbol} ${trade.direction}`);
  };

  const handleDeleteTrade = (trade: Trade) => {
    if (confirm(`Delete trade ${trade.symbol}?`)) {
      setCurrentTrades(prev => prev.filter(t => t.id !== trade.id));
    }
  };

  const handleAddTrade = (date: Date) => {
    alert(`Add new trade for ${date.toLocaleDateString()}`);
    setPopoverOpen(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold">DayDetailPopover Demo</h1>
        <p className="text-muted-foreground">
          Interactive demo showcasing the enhanced calendar day popover component
        </p>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Component Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">🎨 Design</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Glass morphism styling with backdrop blur</li>
                  <li>• Responsive: popover on desktop, sheet on mobile</li>
                  <li>• Smooth Framer Motion animations</li>
                  <li>• Color-coded P&L indicators</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">⚡ Functionality</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Day summary with total P&L and metrics</li>
                  <li>• Individual trade cards with hover effects</li>
                  <li>• Quick actions: view, edit, delete trades</li>
                  <li>• Add new trade with pre-filled date</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">♿ Accessibility</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Keyboard navigation (ESC to close)</li>
                  <li>• Screen reader support with ARIA labels</li>
                  <li>• Focus management</li>
                  <li>• Touch-friendly mobile interactions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">📱 Mobile-First</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Bottom sheet on mobile devices</li>
                  <li>• Larger tap targets for touch</li>
                  <li>• Optimized scrolling experience</li>
                  <li>• Responsive grid layouts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Demo Scenarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Demo Scenarios</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any scenario below to test the DayDetailPopover component
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {demoScenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <DayDetailPopover
                    trades={scenario.id === selectedScenario ? currentTrades : []}
                    date={scenario.date}
                    isOpen={scenario.id === selectedScenario && popoverOpen}
                    onClose={() => setPopoverOpen(false)}
                    onViewTrade={handleViewTrade}
                    onEditTrade={handleEditTrade}
                    onDeleteTrade={handleDeleteTrade}
                    onAddTrade={handleAddTrade}
                  >
                    <Card
                      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 group"
                      onClick={() => handleScenarioClick(scenario)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1">
                            <h3 className="font-semibold group-hover:text-primary">
                              {scenario.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {scenario.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {scenario.tradeCount} trades
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {scenario.date.toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1 text-primary">
                            <span>Try it</span>
                            {scenario.tradeCount > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <Calendar className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DayDetailPopover>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integration Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <h4 className="font-semibold">Ready for Integration</h4>
              <p className="text-sm text-muted-foreground">
                The DayDetailPopover component is ready to be integrated with your TradeCalendarView.
                Use <code className="px-1 py-0.5 bg-muted rounded text-xs">TradeCalendarViewWithPopover</code> for
                automatic integration with smart day handling.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}