import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  Download
} from 'lucide-react';
import { ExportDialog } from '../export';
import { useTradeStore } from '@/store/tradeStore';
import { runWhatIfAnalysis, WhatIfAnalysisResult } from '@/utils/whatIfCalculations';
import { WhatIfScenarios } from './WhatIfScenarios';
import { WhatIfResults } from './WhatIfResults';
import { WhatIfChart } from './WhatIfChart';
import { ImprovementSuggestions } from './ImprovementSuggestions';

interface WhatIfAnalysisProps {
  className?: string;
}

export function WhatIfAnalysis({ className }: WhatIfAnalysisProps) {
  const { trades, loading } = useTradeStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const analysisResult = useMemo<WhatIfAnalysisResult>(() => {
    // Refresh analysis when refreshKey changes
    return runWhatIfAnalysis(trades);
  }, [trades, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const { originalStats, topImprovements, summary } = analysisResult;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            What-If Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            What-If Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No Trade Data</p>
            <p>Add some trades to start analyzing potential improvements.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            What-If Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <ExportDialog
              trades={trades}
              defaultOptions={{
                format: 'csv',
                fileName: 'what-if-analysis',
                includeStats: true
              }}
              trigger={
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Analysis
                </Button>
              }
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Performance Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  ${originalStats.netPnl.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Current P&L</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {originalStats.winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {originalStats.profitFactor.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Profit Factor</div>
              </div>
              
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {originalStats.totalTrades}
                </div>
                <div className="text-sm text-muted-foreground">Total Trades</div>
              </div>
            </div>

            {/* Top Improvements */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Improvement Opportunities
              </h3>
              
              <div className="space-y-3">
                {topImprovements.slice(0, 3).map((result, index) => (
                  <div key={result.scenario.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="secondary" 
                        className="w-8 h-8 rounded-full p-0 flex items-center justify-center"
                        style={{ backgroundColor: result.scenario.color + '20', color: result.scenario.color }}
                      >
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{result.scenario.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.scenario.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +${result.improvement.totalPnlImprovement.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
                        {result.improvement.totalPnlImprovementPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Insights */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Key Insights
              </h3>
              
              <div className="space-y-2">
                {summary.keyInsights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Potential Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Improvement Potential</h3>
              <WhatIfChart analysisResult={analysisResult} />
            </div>
          </TabsContent>

          <TabsContent value="scenarios">
            <WhatIfScenarios analysisResult={analysisResult} />
          </TabsContent>

          <TabsContent value="results">
            <WhatIfResults analysisResult={analysisResult} />
          </TabsContent>

          <TabsContent value="suggestions">
            <ImprovementSuggestions analysisResult={analysisResult} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Best Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-green-600">
                    {summary.bestScenario?.scenario.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    +${summary.bestScenario?.improvement.totalPnlImprovement.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Total Potential
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-blue-600">
                    +${summary.totalPotentialImprovement.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Combined improvement
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Focus Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-600">
                    {topImprovements.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    High-impact scenarios
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Insights by Scenario */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Analysis by Scenario</h3>
              
              {analysisResult.scenarios.map(result => (
                <Card key={result.scenario.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: result.scenario.color }}
                        />
                        {result.scenario.name}
                      </CardTitle>
                      <Badge 
                        variant={result.improvement.totalPnlImprovement > 0 ? 'default' : 'secondary'}
                      >
                        {result.improvement.totalPnlImprovement > 0 ? '+' : ''}
                        ${result.improvement.totalPnlImprovement.toFixed(2)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {result.scenario.description}
                      </p>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">P&L Impact</div>
                          <div className="text-muted-foreground">
                            {result.improvement.totalPnlImprovementPercent > 0 ? '+' : ''}
                            {result.improvement.totalPnlImprovementPercent.toFixed(1)}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium">Win Rate</div>
                          <div className="text-muted-foreground">
                            {result.improvement.winRateImprovement > 0 ? '+' : ''}
                            {result.improvement.winRateImprovement.toFixed(1)}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium">Profit Factor</div>
                          <div className="text-muted-foreground">
                            {result.improvement.profitFactorImprovement > 0 ? '+' : ''}
                            {result.improvement.profitFactorImprovement.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium">Trades Affected</div>
                          <div className="text-muted-foreground">
                            {result.improvement.tradesAffected} trades
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="font-medium text-sm">Actionable Insights:</div>
                        {result.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}