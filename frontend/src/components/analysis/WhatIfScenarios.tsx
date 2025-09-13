import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Percent,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { WhatIfAnalysisResult, WhatIfScenario, WHAT_IF_SCENARIOS } from '@/utils/whatIfCalculations';
import { cn } from '@/lib/utils';

interface WhatIfScenariosProps {
  analysisResult: WhatIfAnalysisResult;
}

interface ScenarioCardProps {
  scenario: WhatIfScenario;
  result: WhatIfAnalysisResult['scenarios'][0];
  rank: number;
}

function ScenarioCard({ scenario, result, rank }: ScenarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { improvement, insights } = result;
  const isPositive = improvement.totalPnlImprovement > 0;
  const impactLevel = Math.abs(improvement.totalPnlImprovementPercent);
  
  const getImpactIcon = () => {
    if (impactLevel > 20) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (impactLevel > 10) return <Activity className="h-4 w-4 text-yellow-600" />;
    if (impactLevel > 0) return <TrendingDown className="h-4 w-4 text-orange-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getImpactLabel = () => {
    if (impactLevel > 20) return 'High Impact';
    if (impactLevel > 10) return 'Medium Impact';
    if (impactLevel > 0) return 'Low Impact';
    return 'No Impact';
  };

  const getCategoryIcon = () => {
    switch (scenario.category) {
      case 'entry': return <Target className="h-4 w-4" />;
      case 'exit': return <CheckCircle2 className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'selection': return <Users className="h-4 w-4" />;
      case 'management': return <BarChart3 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryColor = () => {
    switch (scenario.category) {
      case 'entry': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'exit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'risk': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'selection': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'management': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      rank === 1 && "ring-2 ring-green-500/20 border-green-200 dark:border-green-800"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: scenario.color + '20' }}
            >
              <div style={{ color: scenario.color }}>
                {getCategoryIcon()}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{scenario.name}</CardTitle>
                {rank <= 3 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    #{rank}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {scenario.description}
              </p>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor()}>
                  {scenario.category.replace('_', ' ').toUpperCase()}
                </Badge>
                
                <Badge 
                  variant={isPositive ? 'default' : 'secondary'}
                  className="gap-1"
                >
                  {getImpactIcon()}
                  {getImpactLabel()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              "text-lg font-bold",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? '+' : ''}${improvement.totalPnlImprovement.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
              {improvement.totalPnlImprovementPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Percent className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Win Rate</span>
            </div>
            <div className="text-sm font-bold">
              {improvement.winRateImprovement > 0 ? '+' : ''}
              {improvement.winRateImprovement.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">P. Factor</span>
            </div>
            <div className="text-sm font-bold">
              {improvement.profitFactorImprovement > 0 ? '+' : ''}
              {improvement.profitFactorImprovement.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">R-Multiple</span>
            </div>
            <div className="text-sm font-bold">
              {improvement.avgRMultipleImprovement > 0 ? '+' : ''}
              {improvement.avgRMultipleImprovement.toFixed(2)}
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Affected</span>
            </div>
            <div className="text-sm font-bold">
              {improvement.tradesAffected}
            </div>
          </div>
        </div>

        {/* Impact Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Impact Level</span>
            <span className="text-muted-foreground">
              {Math.abs(improvement.totalPnlImprovementPercent).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(Math.abs(improvement.totalPnlImprovementPercent), 50)} 
            max={50}
            className="h-2"
          />
        </div>

        <Separator className="mb-4" />

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Performance Comparison */}
            <div>
              <h4 className="font-medium text-sm mb-2">Performance Comparison</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Original</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total P&L:</span>
                      <span className="font-mono">${result.originalStats.netPnl.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-mono">{result.originalStats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span className="font-mono">{result.originalStats.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-muted-foreground mb-1">Improved</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total P&L:</span>
                      <span className="font-mono font-bold text-green-600">
                        ${result.improvedStats.netPnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Win Rate:</span>
                      <span className="font-mono font-bold text-green-600">
                        {result.improvedStats.winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profit Factor:</span>
                      <span className="font-mono font-bold text-green-600">
                        {result.improvedStats.profitFactor.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Insights */}
            <div>
              <h4 className="font-medium text-sm mb-2">Actionable Insights</h4>
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded">
                    <div 
                      className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: scenario.color }}
                    />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WhatIfScenarios({ analysisResult }: WhatIfScenariosProps) {
  const [sortBy, setSortBy] = useState<'improvement' | 'winRate' | 'category'>('improvement');
  const [showOnlyPositive, setShowOnlyPositive] = useState(false);

  const sortedScenarios = [...analysisResult.scenarios].sort((a, b) => {
    switch (sortBy) {
      case 'improvement':
        return b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement;
      case 'winRate':
        return b.improvement.winRateImprovement - a.improvement.winRateImprovement;
      case 'category':
        return a.scenario.category.localeCompare(b.scenario.category);
      default:
        return 0;
    }
  });

  const filteredScenarios = showOnlyPositive 
    ? sortedScenarios.filter(s => s.improvement.totalPnlImprovement > 0)
    : sortedScenarios;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scenario Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Explore different trading scenarios and their potential impact on your performance.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="improvement">P&L Impact</option>
              <option value="winRate">Win Rate</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyPositive}
              onChange={(e) => setShowOnlyPositive(e.target.checked)}
              className="rounded"
            />
            Positive only
          </label>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Best Scenario</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {analysisResult.summary.bestScenario?.scenario.name}
            </div>
            <div className="text-sm text-muted-foreground">
              +${analysisResult.summary.bestScenario?.improvement.totalPnlImprovement.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Positive Impact</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {analysisResult.scenarios.filter(s => s.improvement.totalPnlImprovement > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">
              out of {analysisResult.scenarios.length} scenarios
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">High Impact</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {analysisResult.scenarios.filter(s => Math.abs(s.improvement.totalPnlImprovementPercent) > 20).length}
            </div>
            <div className="text-sm text-muted-foreground">
              scenarios &gt; 20% impact
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Total Potential</span>
            </div>
            <div className="text-lg font-bold text-yellow-600">
              +${analysisResult.summary.totalPotentialImprovement.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              combined improvement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Cards */}
      <div className="space-y-4">
        {filteredScenarios.map((result, index) => (
          <ScenarioCard
            key={result.scenario.id}
            scenario={result.scenario}
            result={result}
            rank={analysisResult.scenarios
              .sort((a, b) => b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement)
              .findIndex(s => s.scenario.id === result.scenario.id) + 1
            }
          />
        ))}
      </div>

      {filteredScenarios.length === 0 && (
        <div className="text-center p-8 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No Scenarios Match Filter</p>
          <p>Try adjusting your filters to see more scenarios.</p>
        </div>
      )}
    </div>
  );
}