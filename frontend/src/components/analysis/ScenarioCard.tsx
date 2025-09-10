import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { WhatIfResult } from '@/utils/whatIfCalculations';

interface ScenarioCardProps {
  result: WhatIfResult;
  rank?: number;
  showDetailedView?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

export function ScenarioCard({ 
  result, 
  rank, 
  showDetailedView = false, 
  onToggleDetails,
  className 
}: ScenarioCardProps) {
  const { scenario, originalStats, improvedStats, improvement, insights } = result;
  
  const getImprovementIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };
  
  const getImprovementColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-400';
  };
  
  const getScenarioIcon = (category: string) => {
    switch (category) {
      case 'entry':
      case 'exit':
        return <Target className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      case 'selection':
        return <CheckCircle className="h-4 w-4" />;
      case 'management':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };
  
  const impactLevel = Math.abs(improvement.totalPnlImprovementPercent);
  const impactLabel = impactLevel > 20 ? 'High' : impactLevel > 10 ? 'Medium' : 'Low';
  const impactColor = impactLevel > 20 ? 'bg-red-100 text-red-800 border-red-200' : 
                     impactLevel > 10 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                     'bg-green-100 text-green-800 border-green-200';

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {rank && (
              <Badge 
                variant="secondary" 
                className="w-7 h-7 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: scenario.color + '20', color: scenario.color }}
              >
                {rank}
              </Badge>
            )}
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: scenario.color }}
            />
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {getScenarioIcon(scenario.category)}
                {scenario.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {scenario.description}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`font-bold text-lg ${getImprovementColor(improvement.totalPnlImprovement)}`}>
              {improvement.totalPnlImprovement > 0 ? '+' : ''}${improvement.totalPnlImprovement.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {getImprovementIcon(improvement.totalPnlImprovementPercent)}
              {improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
              {improvement.totalPnlImprovementPercent.toFixed(1)}%
            </div>
          </div>
        </div>
        
        {/* Impact and Category Badges */}
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`text-xs ${impactColor}`}>
            {impactLabel} Impact
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {scenario.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {improvement.tradesAffected} trades affected
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Win Rate</div>
            <div className={`text-lg font-bold ${getImprovementColor(improvement.winRateImprovement)}`}>
              {improvement.winRateImprovement > 0 ? '+' : ''}
              {improvement.winRateImprovement.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Profit Factor</div>
            <div className={`text-lg font-bold ${getImprovementColor(improvement.profitFactorImprovement)}`}>
              {improvement.profitFactorImprovement > 0 ? '+' : ''}
              {improvement.profitFactorImprovement.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">R-Multiple</div>
            <div className={`text-lg font-bold ${getImprovementColor(improvement.avgRMultipleImprovement)}`}>
              {improvement.avgRMultipleImprovement > 0 ? '+' : ''}
              {improvement.avgRMultipleImprovement.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium">Total P&L</div>
            <div className="text-lg font-bold">
              ${improvedStats.netPnl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Improvement Progress Bar */}
        {Math.abs(improvement.totalPnlImprovementPercent) > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Improvement Potential</span>
              <span className={getImprovementColor(improvement.totalPnlImprovementPercent)}>
                {improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
                {improvement.totalPnlImprovementPercent.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(Math.abs(improvement.totalPnlImprovementPercent), 100)} 
              className="h-2"
            />
          </div>
        )}

        {/* Insights Preview */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              Key Insights
            </div>
            
            {showDetailedView ? (
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{insight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {insights[0]}
                {insights.length > 1 && (
                  <span className="text-amber-600 font-medium">
                    {' '}+{insights.length - 1} more insight{insights.length > 2 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Toggle Details Button */}
        {onToggleDetails && insights.length > 1 && (
          <>
            <Separator className="my-4" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleDetails}
              className="w-full"
            >
              {showDetailedView ? 'Show Less' : 'Show More Details'}
            </Button>
          </>
        )}

        {/* Before/After Comparison (Detailed View) */}
        {showDetailedView && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="font-medium text-sm">Before vs After Comparison</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">ORIGINAL</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Net P&L:</span>
                      <span>${originalStats.netPnl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span>{originalStats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span>{originalStats.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-xs font-medium text-green-600">IMPROVED</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Net P&L:</span>
                      <span className="font-medium">${improvedStats.netPnl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-medium">{improvedStats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span className="font-medium">{improvedStats.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}