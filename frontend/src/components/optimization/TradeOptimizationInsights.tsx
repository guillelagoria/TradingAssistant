import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, Target, Scale, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { optimizationService } from '../../services/optimization.service';
import { OptimizationInsights } from '../../types/optimization';
import { useActiveAccount } from '../../store/accountStore';
import StopLossOptimizationTab from './StopLossOptimizationTab';
import TakeProfitOptimizationTab from './TakeProfitOptimizationTab';
import RiskRewardSetupTab from './RiskRewardSetupTab';
import TimingEfficiencyTab from './TimingEfficiencyTab';

const TradeOptimizationInsights = () => {
  const [insights, setInsights] = useState<OptimizationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedAccount = useActiveAccount();

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await optimizationService.getOptimizationInsights(selectedAccount?.id);
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load optimization insights');
        console.error('Error fetching optimization insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [selectedAccount?.id]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!insights) {
    return null;
  }

  // Check if we have enough data
  if (!insights.hasEnoughData) {
    return (
      <Card className="w-full border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-amber-900 dark:text-amber-100">Trade Optimization Insights</CardTitle>
          </div>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            Intelligent recommendations based on your trading history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-300 dark:border-amber-700 bg-amber-100/50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Need more data:</strong> You need at least {insights.minTradesRequired} trades to generate
              optimization insights. Current trades: {insights.currentTrades}.
              <br />
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Keep trading and we'll provide personalized recommendations to improve your performance!
              </span>
            </AlertDescription>
          </Alert>

          {/* Data quality summary */}
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Data Quality</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-amber-700 dark:text-amber-300">MAE/MFE Data:</span>
                <span className="ml-2 font-medium text-amber-900 dark:text-amber-100">
                  {insights.dataQuality.hasMAE} / {insights.currentTrades}
                </span>
              </div>
              <div>
                <span className="text-amber-700 dark:text-amber-300">Advanced Data:</span>
                <span className="ml-2 font-medium text-amber-900 dark:text-amber-100">
                  {insights.dataQuality.hasAdvanced} / {insights.currentTrades}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-blue-900 dark:text-blue-100">Trade Optimization Insights</CardTitle>
          </div>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Data-driven recommendations to maximize your trading performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stopLoss" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="stopLoss" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Stop Loss</span>
              </TabsTrigger>
              <TabsTrigger value="takeProfit" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Target</span>
              </TabsTrigger>
              <TabsTrigger value="riskReward" className="gap-2">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">R:R</span>
              </TabsTrigger>
              <TabsTrigger value="timing" className="gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Timing</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="stopLoss" className="mt-0">
                <StopLossOptimizationTab data={insights.stopLoss} />
              </TabsContent>

              <TabsContent value="takeProfit" className="mt-0">
                <TakeProfitOptimizationTab data={insights.takeProfit} />
              </TabsContent>

              <TabsContent value="riskReward" className="mt-0">
                <RiskRewardSetupTab data={insights.riskReward} />
              </TabsContent>

              <TabsContent value="timing" className="mt-0">
                <TimingEfficiencyTab data={insights.timing} />
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TradeOptimizationInsights;
