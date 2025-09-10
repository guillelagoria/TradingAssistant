import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Brain,
  Zap,
  Star,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  Shield
} from 'lucide-react';
import { WhatIfAnalysisResult, WhatIfResult } from '@/utils/whatIfCalculations';
import { TradeStats } from '@/types';

interface ImprovementSuggestionsProps {
  analysisResult: WhatIfAnalysisResult;
  className?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'risk' | 'entry' | 'exit' | 'psychology' | 'strategy';
  potentialImprovement: number;
  timeToImplement: 'immediate' | 'short' | 'medium' | 'long';
  difficulty: 'easy' | 'medium' | 'hard';
  actionSteps: string[];
  relatedScenarios: string[];
}

export function ImprovementSuggestions({ analysisResult, className }: ImprovementSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const suggestions = generateSmartSuggestions(analysisResult);
  
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedSuggestions = filteredSuggestions.sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk': return <Shield className="h-4 w-4" />;
      case 'entry': return <Target className="h-4 w-4" />;
      case 'exit': return <TrendingUp className="h-4 w-4" />;
      case 'psychology': return <Brain className="h-4 w-4" />;
      case 'strategy': return <BarChart3 className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTimeIcon = (time: string) => {
    return <Clock className="h-3 w-3" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Smart Improvement Suggestions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered recommendations based on your trading patterns and what-if analysis
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Suggestions
          </Button>
          {['risk', 'entry', 'exit', 'psychology', 'strategy'].map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {getCategoryIcon(category)}
              <span className="ml-1">{category}</span>
            </Button>
          ))}
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {sortedSuggestions.map((suggestion, index) => (
            <Card key={suggestion.id} className="border-l-4" style={{ borderLeftColor: suggestion.priority === 'high' ? '#DC2626' : suggestion.priority === 'medium' ? '#D97706' : '#059669' }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {getCategoryIcon(suggestion.category)}
                        <span className="ml-1">{suggestion.category}</span>
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      {suggestion.title}
                    </CardTitle>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.description}
                    </p>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="font-bold text-green-600">
                      +${suggestion.potentialImprovement.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      potential improvement
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {getTimeIcon(suggestion.timeToImplement)}
                    <span className="capitalize">{suggestion.timeToImplement} term</span>
                  </div>
                  <div className={`flex items-center gap-1 ${getDifficultyColor(suggestion.difficulty)}`}>
                    <Zap className="h-3 w-3" />
                    <span className="capitalize">{suggestion.difficulty}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Progress Indicator */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Implementation Impact</span>
                    <span className="text-green-600">
                      {Math.min((suggestion.potentialImprovement / 1000) * 100, 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((suggestion.potentialImprovement / 1000) * 100, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Action Steps (Expandable) */}
                {expandedSuggestion === suggestion.id ? (
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium text-sm mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Action Steps
                      </div>
                      <div className="space-y-2">
                        {suggestion.actionSteps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-start gap-2 text-sm">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {stepIndex + 1}
                            </Badge>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Related Scenarios */}
                    {suggestion.relatedScenarios.length > 0 && (
                      <div>
                        <div className="font-medium text-sm mb-2">Related Analysis</div>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.relatedScenarios.map(scenario => (
                            <Badge key={scenario} variant="secondary" className="text-xs">
                              {scenario}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {suggestion.actionSteps[0]}
                    {suggestion.actionSteps.length > 1 && (
                      <span className="text-blue-600 font-medium">
                        {' '}+{suggestion.actionSteps.length - 1} more steps
                      </span>
                    )}
                  </div>
                )}

                <Separator className="my-4" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )}
                  className="w-full"
                >
                  {expandedSuggestion === suggestion.id ? 'Show Less' : 'View Action Plan'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedSuggestions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No suggestions available for the selected category.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Generate smart suggestions based on what-if analysis results
 */
function generateSmartSuggestions(analysisResult: WhatIfAnalysisResult): Suggestion[] {
  const { originalStats, topImprovements, scenarios } = analysisResult;
  const suggestions: Suggestion[] = [];

  // Analyze each scenario and generate specific suggestions
  topImprovements.forEach((result, index) => {
    const scenario = result.scenario;
    const improvement = result.improvement;

    switch (scenario.id) {
      case 'better_entry':
        if (improvement.totalPnlImprovement > 100) {
          suggestions.push({
            id: 'improve-entry-timing',
            title: 'Master Entry Timing Techniques',
            description: 'Your entry timing has significant room for improvement. Focus on patience and precision.',
            priority: 'high',
            category: 'entry',
            potentialImprovement: improvement.totalPnlImprovement,
            timeToImplement: 'medium',
            difficulty: 'medium',
            actionSteps: [
              'Set up price alerts at key support/resistance levels',
              'Use limit orders instead of market orders when possible',
              'Wait for confirmation candles before entering',
              'Practice with paper trading to improve timing',
              'Review your best entry trades to identify patterns'
            ],
            relatedScenarios: ['Better Entry Timing']
          });
        }
        break;

      case 'proper_position_sizing':
        if (improvement.totalPnlImprovement > 200) {
          suggestions.push({
            id: 'implement-position-sizing',
            title: 'Implement Consistent Position Sizing',
            description: 'Proper position sizing could dramatically improve your risk-adjusted returns.',
            priority: 'high',
            category: 'risk',
            potentialImprovement: improvement.totalPnlImprovement,
            timeToImplement: 'immediate',
            difficulty: 'easy',
            actionSteps: [
              'Calculate 2% risk per trade before entering',
              'Use a position sizing calculator',
              'Set maximum position size limits',
              'Document position size in your trading journal',
              'Review position sizing weekly'
            ],
            relatedScenarios: ['Proper Position Sizing']
          });
        }
        break;

      case 'winning_setups_only':
        if (improvement.tradesAffected > originalStats.totalTrades * 0.3) {
          suggestions.push({
            id: 'filter-losing-setups',
            title: 'Eliminate Losing Trade Patterns',
            description: 'You could avoid significant losses by identifying and filtering out poor setups.',
            priority: 'high',
            category: 'strategy',
            potentialImprovement: improvement.totalPnlImprovement,
            timeToImplement: 'medium',
            difficulty: 'medium',
            actionSteps: [
              'Analyze your losing trades for common patterns',
              'Create a "do not trade" checklist',
              'Backtest your winning setups only',
              'Set up alerts for your best setup conditions',
              'Track setup quality score for each trade'
            ],
            relatedScenarios: ['Winning Setups Only']
          });
        }
        break;

      case 'trailing_stops':
        if (improvement.totalPnlImprovement > 150) {
          suggestions.push({
            id: 'implement-trailing-stops',
            title: 'Use Dynamic Exit Management',
            description: 'Trailing stops could help you capture more profit from winning trades.',
            priority: 'medium',
            category: 'exit',
            potentialImprovement: improvement.totalPnlImprovement,
            timeToImplement: 'short',
            difficulty: 'medium',
            actionSteps: [
              'Learn how to set trailing stops on your platform',
              'Start with 3-5% trailing stop distance',
              'Test different trailing percentages',
              'Combine with partial profit taking',
              'Monitor market volatility for adjustments'
            ],
            relatedScenarios: ['Trailing Stop Loss']
          });
        }
        break;

      case 'remove_worst_trades':
        suggestions.push({
          id: 'psychology-discipline',
          title: 'Develop Trading Discipline',
          description: 'Your worst trades show patterns that suggest emotional or impulsive decisions.',
          priority: originalStats.winRate < 40 ? 'high' : 'medium',
          category: 'psychology',
          potentialImprovement: improvement.totalPnlImprovement,
          timeToImplement: 'long',
          difficulty: 'hard',
          actionSteps: [
            'Keep a detailed trading journal with emotions',
            'Take breaks after losing trades',
            'Set daily loss limits and stick to them',
            'Practice meditation or stress management',
            'Review trades when calm, not during market hours'
          ],
          relatedScenarios: ['Remove Worst 10%']
        });
        break;
    }
  });

  // Add general suggestions based on overall statistics
  if (originalStats.winRate < 45) {
    suggestions.push({
      id: 'improve-win-rate',
      title: 'Focus on Trade Quality Over Quantity',
      description: 'Your win rate suggests you may be taking too many marginal trades.',
      priority: 'high',
      category: 'strategy',
      potentialImprovement: originalStats.totalPnl * 0.3,
      timeToImplement: 'medium',
      difficulty: 'medium',
      actionSteps: [
        'Reduce trading frequency by 25%',
        'Only take A+ setups for one month',
        'Increase minimum risk-reward ratio to 1:2',
        'Wait for higher probability entry signals',
        'Track and analyze your best vs worst setups'
      ],
      relatedScenarios: []
    });
  }

  if (originalStats.profitFactor < 1.5) {
    suggestions.push({
      id: 'improve-profit-factor',
      title: 'Optimize Risk-Reward Balance',
      description: 'Your profit factor indicates losses are eating into gains. Focus on letting winners run.',
      priority: 'high',
      category: 'exit',
      potentialImprovement: Math.abs(originalStats.totalPnl) * 0.4,
      timeToImplement: 'short',
      difficulty: 'medium',
      actionSteps: [
        'Set profit targets at least 2x your stop loss',
        'Use trailing stops on profitable trades',
        'Avoid taking profits too early',
        'Scale out of positions gradually',
        'Review your average win vs average loss ratio'
      ],
      relatedScenarios: ['Better Exit Timing', 'Trailing Stop Loss']
    });
  }

  return suggestions.slice(0, 8); // Limit to top 8 suggestions
}