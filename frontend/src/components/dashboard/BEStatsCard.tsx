import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  AlertTriangle,
  Info,
  Activity,
  DollarSign,
  RefreshCw,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { BEAnalysisService, BEStatsData } from '@/services/beAnalysisService';

interface BEStatsCardProps {
  onViewDetails?: () => void;
  refreshTrigger?: number;
}

const getStrategyInfo = (strategy: string) => {
  const strategies = {
    'aggressive-be': {
      name: 'Aggressive BE',
      description: 'Move to break-even quickly',
      color: 'bg-orange-500',
      icon: TrendingUp
    },
    'moderate-be': {
      name: 'Moderate BE',
      description: 'Standard break-even approach',
      color: 'bg-blue-500',
      icon: Target
    },
    'conservative-be': {
      name: 'Conservative BE',
      description: 'Move to break-even later',
      color: 'bg-green-500',
      icon: Shield
    },
    'no-be': {
      name: 'No Break-Even',
      description: 'Avoid break-even stops',
      color: 'bg-red-500',
      icon: AlertTriangle
    },
    'insufficient-data': {
      name: 'Need More Data',
      description: 'More trades needed for recommendation',
      color: 'bg-gray-500',
      icon: Info
    }
  };

  return strategies[strategy as keyof typeof strategies] || strategies['insufficient-data'];
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(1)}%`;
};

export function BEStatsCard({ onViewDetails, refreshTrigger = 0 }: BEStatsCardProps) {
  const [data, setData] = useState<BEStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBEData = async () => {
    try {
      setError(null);
      const beData = await BEAnalysisService.getBEMetrics();
      setData(beData);
    } catch (err) {
      console.error('Failed to fetch BE data:', err);
      setError('Failed to load break-even data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBEData();
  }, [refreshTrigger]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBEData();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Break-Even Analysis</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Break-Even Analysis</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.tradesWithBE === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Break-Even Analysis
          </CardTitle>
          <CardDescription>
            No break-even data available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Info className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Start using break-even stops in your trades to see analysis here
            </p>
            <p className="text-sm text-gray-500">
              Add break-even data in the trade form's Analysis tab
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const strategyInfo = getStrategyInfo(data.recommendedStrategy);
  const StrategyIcon = strategyInfo.icon;

  const impactIsPositive = data.netBEImpact > 0;
  const impactColor = impactIsPositive ? 'text-green-600' : 'text-red-600';
  const impactIcon = impactIsPositive ? TrendingUp : TrendingDown;
  const ImpactIcon = impactIcon;

  // Calculate overall performance score
  const performanceScore = Math.min(100,
    (data.beSuccessRate * 0.4) +
    (data.avgProfitCaptureRate * 0.3) +
    ((data.netBEImpact > 0 ? 100 : 0) * 0.3)
  );

  const performanceLevel = performanceScore >= 80 ? 'excellent' :
                          performanceScore >= 60 ? 'good' :
                          performanceScore >= 40 ? 'fair' : 'poor';

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Break-Even Analysis
                <Badge
                  variant={performanceLevel === 'excellent' ? 'default' :
                          performanceLevel === 'good' ? 'secondary' :
                          performanceLevel === 'fair' ? 'outline' : 'destructive'}
                  className="ml-2 text-xs"
                >
                  {performanceLevel.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Analysis of {data.tradesWithBE} trades with BE data
                <span className="hidden sm:inline"> • Performance: {formatPercentage(performanceScore)}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails} className="hidden sm:flex">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails} className="sm:hidden">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help flex items-center gap-1">
                      BE Success Rate
                      <Info className="h-3 w-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Percentage of times break-even stops worked as intended</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${
                    data.beSuccessRate >= 70 ? 'text-green-600' :
                    data.beSuccessRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(data.beSuccessRate)}
                  </span>
                </div>
              </div>
              <Progress
                value={data.beSuccessRate}
                className={`h-2 ${
                  data.beSuccessRate >= 70 ? '[&>*]:bg-green-600' :
                  data.beSuccessRate >= 50 ? '[&>*]:bg-yellow-600' : '[&>*]:bg-red-600'
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help flex items-center gap-1">
                      Profit Capture
                      <Info className="h-3 w-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average percentage of maximum potential profit captured</p>
                  </TooltipContent>
                </Tooltip>
                <span className={`text-2xl font-bold ${
                  data.avgProfitCaptureRate >= 80 ? 'text-green-600' :
                  data.avgProfitCaptureRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formatPercentage(data.avgProfitCaptureRate)}
                </span>
              </div>
              <Progress
                value={data.avgProfitCaptureRate}
                className={`h-2 ${
                  data.avgProfitCaptureRate >= 80 ? '[&>*]:bg-green-600' :
                  data.avgProfitCaptureRate >= 60 ? '[&>*]:bg-yellow-600' : '[&>*]:bg-red-600'
                }`}
              />
            </div>
          </div>

          <Separator />

          {/* Financial Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-600">Protected Profit</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(data.totalProtectedProfit)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total profit protected by break-even stops</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs text-gray-600">Missed Profit</span>
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    {formatCurrency(data.totalMissedProfit)}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Potential profit lost due to early break-even exits</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Net Impact */}
          <div className={`rounded-lg p-4 ${
            impactIsPositive ? 'bg-green-50 border border-green-200' :
            data.netBEImpact < -50 ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImpactIcon className={`h-5 w-5 ${impactColor}`} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm font-medium cursor-help flex items-center gap-1">
                      Net BE Impact
                      <Info className="h-3 w-3 text-gray-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Protected profit minus missed profit opportunities</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="text-right">
                <span className={`text-xl font-bold ${impactColor}`}>
                  {impactIsPositive ? '+' : ''}{formatCurrency(data.netBEImpact)}
                </span>
                <div className="text-xs text-gray-500">
                  {((data.netBEImpact / Math.max(1, data.totalProtectedProfit + data.totalMissedProfit)) * 100).toFixed(1)}% impact
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {impactIsPositive ?
                'Your break-even strategy is adding value to your trading portfolio' :
                data.netBEImpact < -100 ?
                'Consider adjusting your break-even approach - significant opportunity cost detected' :
                'Break-even strategy shows mixed results - room for optimization'
              }
            </p>
          </div>

          <Separator />

          {/* Recommended Strategy */}
          <div className="space-y-3">
            <span className="text-sm font-medium">Recommended Strategy</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 cursor-help">
                  <div className={`w-4 h-4 rounded-full ${strategyInfo.color} flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">{strategyInfo.name}</p>
                    <p className="text-sm text-blue-700">{strategyInfo.description}</p>
                  </div>
                  <StrategyIcon className="h-6 w-6 text-blue-600" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click "Details" to see optimization scenarios and advanced strategies</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Smart Insights */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
              Smart Insights
            </h4>
            <div className="space-y-2">
              {data.beSuccessRate > 70 && (
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    High BE success rate ({formatPercentage(data.beSuccessRate)}) indicates excellent risk management skills
                  </p>
                </div>
              )}
              {data.beSuccessRate < 40 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    Low BE success rate suggests break-even stops may be placed too aggressively
                  </p>
                </div>
              )}
              {data.avgProfitCaptureRate > 80 && (
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    Excellent profit capture ({formatPercentage(data.avgProfitCaptureRate)}) demonstrates strong exit timing
                  </p>
                </div>
              )}
              {data.avgProfitCaptureRate < 50 && (
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    Low profit capture rate suggests opportunity for better exit management
                  </p>
                </div>
              )}
              {data.netBEImpact > 100 && (
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    BE strategy has significantly boosted your profitability (+{formatCurrency(data.netBEImpact)})
                  </p>
                </div>
              )}
              {data.netBEImpact < -100 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    Consider refining BE placement strategy to reduce opportunity cost
                  </p>
                </div>
              )}
              {data.tradesWithBE < 10 && (
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    More BE trades needed for statistically reliable recommendations
                  </p>
                </div>
              )}
              {data.tradesWithBE >= 20 && performanceScore >= 75 && (
                <div className="flex items-start gap-2">
                  <Activity className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">
                    Strong BE performance with sufficient data - consider advanced optimization
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}