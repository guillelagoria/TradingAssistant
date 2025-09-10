import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Percent,
  Target,
  Activity,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { WhatIfAnalysisResult } from '@/utils/whatIfCalculations';
import { cn } from '@/lib/utils';

interface WhatIfResultsProps {
  analysisResult: WhatIfAnalysisResult;
}

interface MetricCardProps {
  title: string;
  originalValue: number;
  improvedValue: number;
  format: 'currency' | 'percentage' | 'number';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, originalValue, improvedValue, format, icon, description }: MetricCardProps) {
  const improvement = improvedValue - originalValue;
  const isPositive = improvement > 0;
  const isNeutral = improvement === 0;
  
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const formatImprovement = (value: number) => {
    const sign = value > 0 ? '+' : '';
    switch (format) {
      case 'currency':
        return `${sign}$${value.toFixed(2)}`;
      case 'percentage':
        return `${sign}${value.toFixed(1)}%`;
      case 'number':
        return `${sign}${value.toFixed(2)}`;
      default:
        return `${sign}${value}`;
    }
  };

  const getImprovementIcon = () => {
    if (isNeutral) return <Minus className="h-4 w-4 text-gray-500" />;
    return isPositive 
      ? <ArrowUpRight className="h-4 w-4 text-green-500" />
      : <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          {getImprovementIcon()}
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Original:</span>
            <span className="text-sm font-mono">{formatValue(originalValue)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Improved:</span>
            <span className={cn(
              "text-sm font-mono font-bold",
              isPositive ? "text-green-600" : isNeutral ? "text-gray-600" : "text-red-600"
            )}>
              {formatValue(improvedValue)}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Change:</span>
            <span className={cn(
              "text-sm font-mono font-bold",
              isPositive ? "text-green-600" : isNeutral ? "text-gray-600" : "text-red-600"
            )}>
              {formatImprovement(improvement)}
            </span>
          </div>
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ComparisonTableProps {
  originalStats: WhatIfAnalysisResult['originalStats'];
  scenarios: WhatIfAnalysisResult['scenarios'];
}

function ComparisonTable({ originalStats, scenarios }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 font-medium">Scenario</th>
            <th className="text-right p-2 font-medium">P&L Impact</th>
            <th className="text-right p-2 font-medium">Win Rate</th>
            <th className="text-right p-2 font-medium">Profit Factor</th>
            <th className="text-right p-2 font-medium">Avg R-Multiple</th>
            <th className="text-right p-2 font-medium">Trades Affected</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b bg-muted/50">
            <td className="p-2 font-medium">Current Performance</td>
            <td className="text-right p-2 font-mono">${originalStats.netPnl.toFixed(2)}</td>
            <td className="text-right p-2 font-mono">{originalStats.winRate.toFixed(1)}%</td>
            <td className="text-right p-2 font-mono">{originalStats.profitFactor.toFixed(2)}</td>
            <td className="text-right p-2 font-mono">{originalStats.avgRMultiple.toFixed(2)}</td>
            <td className="text-right p-2 font-mono">{originalStats.totalTrades}</td>
          </tr>
          
          {scenarios
            .sort((a, b) => b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement)
            .map((result, index) => (
            <tr key={result.scenario.id} className="border-b hover:bg-muted/30">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: result.scenario.color }}
                  />
                  <span>{result.scenario.name}</span>
                  {index < 3 && (
                    <Badge variant="secondary" className="text-xs">
                      Top {index + 1}
                    </Badge>
                  )}
                </div>
              </td>
              
              <td className="text-right p-2">
                <div className="space-y-1">
                  <div className={cn(
                    "font-mono font-bold",
                    result.improvement.totalPnlImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    ${result.improvedStats.netPnl.toFixed(2)}
                  </div>
                  <div className={cn(
                    "text-xs font-mono",
                    result.improvement.totalPnlImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {result.improvement.totalPnlImprovement > 0 ? '+' : ''}
                    ${result.improvement.totalPnlImprovement.toFixed(2)}
                  </div>
                </div>
              </td>
              
              <td className="text-right p-2">
                <div className="space-y-1">
                  <div className="font-mono">{result.improvedStats.winRate.toFixed(1)}%</div>
                  <div className={cn(
                    "text-xs font-mono",
                    result.improvement.winRateImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {result.improvement.winRateImprovement > 0 ? '+' : ''}
                    {result.improvement.winRateImprovement.toFixed(1)}%
                  </div>
                </div>
              </td>
              
              <td className="text-right p-2">
                <div className="space-y-1">
                  <div className="font-mono">{result.improvedStats.profitFactor.toFixed(2)}</div>
                  <div className={cn(
                    "text-xs font-mono",
                    result.improvement.profitFactorImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {result.improvement.profitFactorImprovement > 0 ? '+' : ''}
                    {result.improvement.profitFactorImprovement.toFixed(2)}
                  </div>
                </div>
              </td>
              
              <td className="text-right p-2">
                <div className="space-y-1">
                  <div className="font-mono">{result.improvedStats.avgRMultiple.toFixed(2)}</div>
                  <div className={cn(
                    "text-xs font-mono",
                    result.improvement.avgRMultipleImprovement > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {result.improvement.avgRMultipleImprovement > 0 ? '+' : ''}
                    {result.improvement.avgRMultipleImprovement.toFixed(2)}
                  </div>
                </div>
              </td>
              
              <td className="text-right p-2 font-mono">
                {result.improvement.tradesAffected}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WhatIfResults({ analysisResult }: WhatIfResultsProps) {
  const [selectedScenario, setSelectedScenario] = useState(analysisResult.scenarios[0]?.scenario.id || '');
  
  const selectedResult = analysisResult.scenarios.find(s => s.scenario.id === selectedScenario);
  const topScenarios = [...analysisResult.scenarios]
    .sort((a, b) => b.improvement.totalPnlImprovement - a.improvement.totalPnlImprovement)
    .slice(0, 3);

  if (!selectedResult) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">No Results Available</p>
        <p>Unable to load scenario results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Detailed Results Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Compare performance metrics across different scenarios and identify the best opportunities for improvement.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
          <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Top 3 Scenarios */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top 3 Improvement Opportunities
            </h4>
            
            <div className="space-y-4">
              {topScenarios.map((result, index) => (
                <Card key={result.scenario.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                          style={{ backgroundColor: result.scenario.color + '20', color: result.scenario.color }}
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <div className="font-semibold">{result.scenario.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.scenario.description}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          +${result.improvement.totalPnlImprovement.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
                          {result.improvement.totalPnlImprovementPercent.toFixed(1)}% improvement
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div>
            <h4 className="font-semibold mb-4">Best Case Scenario Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total P&L"
                originalValue={analysisResult.originalStats.netPnl}
                improvedValue={topScenarios[0].improvedStats.netPnl}
                format="currency"
                icon={<DollarSign className="h-4 w-4 text-green-600" />}
                description="Best potential P&L outcome"
              />
              
              <MetricCard
                title="Win Rate"
                originalValue={analysisResult.originalStats.winRate}
                improvedValue={topScenarios[0].improvedStats.winRate}
                format="percentage"
                icon={<Percent className="h-4 w-4 text-blue-600" />}
                description="Percentage of winning trades"
              />
              
              <MetricCard
                title="Profit Factor"
                originalValue={analysisResult.originalStats.profitFactor}
                improvedValue={topScenarios[0].improvedStats.profitFactor}
                format="number"
                icon={<Activity className="h-4 w-4 text-purple-600" />}
                description="Gross profit / gross loss"
              />
              
              <MetricCard
                title="Avg R-Multiple"
                originalValue={analysisResult.originalStats.avgRMultiple}
                improvedValue={topScenarios[0].improvedStats.avgRMultiple}
                format="number"
                icon={<Target className="h-4 w-4 text-orange-600" />}
                description="Average risk-reward ratio"
              />
            </div>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ${analysisResult.summary.totalPotentialImprovement.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Potential Improvement</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisResult.scenarios.filter(s => s.improvement.totalPnlImprovement > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Positive Impact Scenarios</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {((topScenarios[0].improvement.totalPnlImprovement / Math.abs(analysisResult.originalStats.netPnl)) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Best Scenario Improvement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <ComparisonTable 
            originalStats={analysisResult.originalStats}
            scenarios={analysisResult.scenarios}
          />
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          {/* Scenario Selector */}
          <div>
            <label className="text-sm font-medium block mb-2">Select Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="border rounded px-3 py-2 bg-background min-w-[200px]"
            >
              {analysisResult.scenarios.map(result => (
                <option key={result.scenario.id} value={result.scenario.id}>
                  {result.scenario.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Scenario Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedResult.scenario.color }}
                />
                {selectedResult.scenario.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedResult.scenario.description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total P&L"
                  originalValue={selectedResult.originalStats.netPnl}
                  improvedValue={selectedResult.improvedStats.netPnl}
                  format="currency"
                  icon={<DollarSign className="h-4 w-4 text-green-600" />}
                />
                
                <MetricCard
                  title="Win Rate"
                  originalValue={selectedResult.originalStats.winRate}
                  improvedValue={selectedResult.improvedStats.winRate}
                  format="percentage"
                  icon={<Percent className="h-4 w-4 text-blue-600" />}
                />
                
                <MetricCard
                  title="Profit Factor"
                  originalValue={selectedResult.originalStats.profitFactor}
                  improvedValue={selectedResult.improvedStats.profitFactor}
                  format="number"
                  icon={<Activity className="h-4 w-4 text-purple-600" />}
                />
                
                <MetricCard
                  title="Avg R-Multiple"
                  originalValue={selectedResult.originalStats.avgRMultiple}
                  improvedValue={selectedResult.improvedStats.avgRMultiple}
                  format="number"
                  icon={<Target className="h-4 w-4 text-orange-600" />}
                />
              </div>

              <Separator />

              {/* Actionable Insights */}
              <div>
                <h4 className="font-semibold mb-3">Actionable Insights</h4>
                <div className="space-y-2">
                  {selectedResult.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <div 
                        className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: selectedResult.scenario.color }}
                      />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}