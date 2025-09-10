import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { Trade, TradeDirection } from '@/types';

interface TradeWhatIfAnalysisProps {
  trade: Trade;
  className?: string;
}

interface WhatIfTradeScenario {
  id: string;
  name: string;
  description: string;
  hypotheticalPnL: number;
  improvement: number;
  improvementPercent: number;
  feasible: boolean;
  insights: string[];
}

export function TradeWhatIfAnalysis({ trade, className }: TradeWhatIfAnalysisProps) {
  const scenarios = useMemo(() => calculateTradeWhatIfScenarios(trade), [trade]);
  
  if (!trade.exitPrice) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trade What-If Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Trade Not Completed</p>
            <p>Complete this trade to see What-If analysis and improvement opportunities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestScenario = scenarios.reduce((best, scenario) => 
    scenario.improvement > best.improvement ? scenario : best, scenarios[0]);

  const worstScenario = scenarios.reduce((worst, scenario) => 
    scenario.improvement < worst.improvement ? scenario : worst, scenarios[0]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Individual Trade What-If Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore how different decisions could have affected this specific trade
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Trade Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className={`text-lg font-bold ${trade.pnl > 0 ? 'text-green-600' : trade.pnl < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              ${trade.netPnl.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Actual P&L</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {trade.efficiency.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Efficiency</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {trade.rMultiple.toFixed(2)}R
            </div>
            <div className="text-sm text-muted-foreground">R-Multiple</div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {trade.pnlPercentage.toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">Return %</div>
          </div>
        </div>

        {/* Best/Worst Scenarios Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Best Opportunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">{bestScenario.name}</div>
              <div className="text-2xl font-bold text-green-600">
                +${bestScenario.improvement.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {bestScenario.improvementPercent > 0 ? '+' : ''}
                {bestScenario.improvementPercent.toFixed(1)}% improvement
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Biggest Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">{worstScenario.name}</div>
              <div className="text-2xl font-bold text-red-600">
                ${worstScenario.improvement.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {worstScenario.improvementPercent.toFixed(1)}% difference
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Detailed Scenarios */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Scenario Analysis</h3>
          
          {scenarios.map((scenario, index) => (
            <Card key={scenario.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={scenario.feasible ? 'default' : 'secondary'}
                      className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                    >
                      {index + 1}
                    </Badge>
                    <div>
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold text-lg ${scenario.improvement > 0 ? 'text-green-600' : scenario.improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {scenario.improvement > 0 ? '+' : ''}${scenario.improvement.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      {scenario.improvement > 0 ? 
                        <ArrowUpRight className="h-3 w-3" /> : 
                        <ArrowDownRight className="h-3 w-3" />
                      }
                      {scenario.improvementPercent > 0 ? '+' : ''}
                      {scenario.improvementPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Feasibility and Impact Indicators */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={scenario.feasible ? 'default' : 'secondary'} className="text-xs">
                    {scenario.feasible ? 'Achievable' : 'Theoretical'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      Math.abs(scenario.improvementPercent) > 50 ? 'border-red-200 text-red-800' :
                      Math.abs(scenario.improvementPercent) > 20 ? 'border-yellow-200 text-yellow-800' :
                      'border-green-200 text-green-800'
                    }`}
                  >
                    {Math.abs(scenario.improvementPercent) > 50 ? 'High Impact' :
                     Math.abs(scenario.improvementPercent) > 20 ? 'Medium Impact' :
                     'Low Impact'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Hypothetical P&L Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Hypothetical P&L</span>
                    <span className="font-medium">${scenario.hypotheticalPnL.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={50} 
                      className="h-2"
                    />
                    <div 
                      className={`absolute top-0 h-2 rounded ${
                        scenario.improvement > 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        left: '50%',
                        width: `${Math.min(Math.abs(scenario.improvementPercent) / 2, 50)}%`,
                        transform: scenario.improvement < 0 ? 'translateX(-100%)' : 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Insights */}
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Key Insights
                  </div>
                  {scenario.insights.map((insight, insightIndex) => (
                    <div key={insightIndex} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{insight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Calculate What-If scenarios for an individual trade
 */
function calculateTradeWhatIfScenarios(trade: Trade): WhatIfTradeScenario[] {
  const scenarios: WhatIfTradeScenario[] = [];
  const actualPnL = trade.netPnl;

  // Scenario 1: Perfect Entry (best possible entry based on maxAdversePrice)
  if (trade.maxAdversePrice) {
    const perfectEntryPrice = trade.direction === TradeDirection.LONG ? 
      trade.maxAdversePrice : 
      trade.maxAdversePrice;
    
    const priceChange = trade.exitPrice! - perfectEntryPrice;
    const perfectPnL = trade.direction === TradeDirection.LONG ? 
      priceChange * trade.quantity : 
      -priceChange * trade.quantity;
    const perfectNetPnL = perfectPnL - trade.commission;
    const improvement = perfectNetPnL - actualPnL;

    scenarios.push({
      id: 'perfect_entry',
      name: 'Perfect Entry Timing',
      description: 'If you had entered at the most favorable price during the trade period',
      hypotheticalPnL: perfectNetPnL,
      improvement,
      improvementPercent: actualPnL !== 0 ? (improvement / Math.abs(actualPnL)) * 100 : 0,
      feasible: false,
      insights: [
        `Entry at $${perfectEntryPrice.toFixed(2)} vs actual $${trade.entryPrice.toFixed(2)}`,
        'Consider using limit orders near support/resistance levels',
        'Wait for better confirmation signals before entering'
      ]
    });
  }

  // Scenario 2: Perfect Exit (best possible exit based on maxFavorablePrice)
  if (trade.maxFavorablePrice) {
    const priceChange = trade.maxFavorablePrice - trade.entryPrice;
    const perfectPnL = trade.direction === TradeDirection.LONG ? 
      priceChange * trade.quantity : 
      -priceChange * trade.quantity;
    const perfectNetPnL = perfectPnL - trade.commission;
    const improvement = perfectNetPnL - actualPnL;

    scenarios.push({
      id: 'perfect_exit',
      name: 'Perfect Exit Timing',
      description: 'If you had exited at the most favorable price during the trade period',
      hypotheticalPnL: perfectNetPnL,
      improvement,
      improvementPercent: actualPnL !== 0 ? (improvement / Math.abs(actualPnL)) * 100 : 0,
      feasible: false,
      insights: [
        `Exit at $${trade.maxFavorablePrice.toFixed(2)} vs actual $${trade.exitPrice!.toFixed(2)}`,
        'Consider using trailing stops to capture more upside',
        'Set multiple profit targets to scale out of positions'
      ]
    });
  }

  // Scenario 3: Hit Stop Loss (if trade was profitable but could have been stopped out)
  if (trade.stopLoss && trade.netPnL > 0) {
    const priceChange = trade.stopLoss - trade.entryPrice;
    const stopPnL = trade.direction === TradeDirection.LONG ? 
      priceChange * trade.quantity : 
      -priceChange * trade.quantity;
    const stopNetPnL = stopPnL - trade.commission;
    const improvement = stopNetPnL - actualPnL;

    scenarios.push({
      id: 'hit_stop_loss',
      name: 'Stop Loss Hit',
      description: 'If the trade had been stopped out at your planned stop loss level',
      hypotheticalPnL: stopNetPnL,
      improvement,
      improvementPercent: actualPnL !== 0 ? (improvement / Math.abs(actualPnL)) * 100 : 0,
      feasible: true,
      insights: [
        `Would have resulted in $${stopNetPnL.toFixed(2)} loss instead of $${actualPnL.toFixed(2)} profit`,
        'This shows your stop loss was appropriately placed',
        'Consider position sizing to manage risk appropriately'
      ]
    });
  }

  // Scenario 4: Double Position Size
  const doublePnL = (trade.pnl * 2) - trade.commission;
  scenarios.push({
    id: 'double_position',
    name: 'Double Position Size',
    description: 'If you had doubled your position size for this trade',
    hypotheticalPnL: doublePnL,
    improvement: doublePnL - actualPnL,
    improvementPercent: 100, // Always 100% more
    feasible: true,
    insights: [
      'Doubling position size doubles both profits and losses',
      'Only increase position size if risk management allows',
      'Consider your overall portfolio allocation before sizing up'
    ]
  });

  // Scenario 5: Half Position Size
  const halfPnL = (trade.pnl * 0.5) - (trade.commission * 0.5);
  scenarios.push({
    id: 'half_position',
    name: 'Half Position Size',
    description: 'If you had used half the position size for this trade',
    hypotheticalPnL: halfPnL,
    improvement: halfPnL - actualPnL,
    improvementPercent: -50, // Always 50% less
    feasible: true,
    insights: [
      'Smaller position reduces both profits and losses',
      'Good for trades with lower confidence levels',
      'Helps preserve capital during uncertain market conditions'
    ]
  });

  // Scenario 6: No Commission (theoretical)
  const noCommissionPnL = trade.pnl;
  scenarios.push({
    id: 'no_commission',
    name: 'Zero Commission',
    description: 'If this trade had no commission costs',
    hypotheticalPnL: noCommissionPnL,
    improvement: trade.commission,
    improvementPercent: actualPnL !== 0 ? (trade.commission / Math.abs(actualPnL)) * 100 : 0,
    feasible: false,
    insights: [
      `Commission cost: $${trade.commission.toFixed(2)}`,
      'Consider commission impact when planning trades',
      'Look for brokers with competitive commission rates'
    ]
  });

  return scenarios.filter(s => !isNaN(s.improvement) && isFinite(s.improvement));
}