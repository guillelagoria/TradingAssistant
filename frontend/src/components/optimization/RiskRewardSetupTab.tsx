import { motion } from 'framer-motion';
import { Scale, TrendingUp, TrendingDown, Target, Shield, Zap } from 'lucide-react';
import { RiskRewardSetup } from '../../types/optimization';
import { Card, CardContent } from '../ui/card';

interface Props {
  data: RiskRewardSetup | null;
}

const RiskRewardSetupTab = ({ data }: Props) => {
  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Not enough data to generate risk:reward recommendations.</p>
        <p className="text-sm mt-2">Continue trading to build your performance history.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${Math.abs(value).toFixed(2)}`;
  const formatPoints = (value: number) => `${Math.abs(value).toFixed(2)} pts`;
  const formatRatio = (value: number) => `1:${value.toFixed(2)}`;

  // Determine R:R quality
  const getRRQuality = (rr: number) => {
    if (rr >= 2.0) return { color: 'green', label: 'Excellent', icon: '🌟' };
    if (rr >= 1.5) return { color: 'blue', label: 'Good', icon: '👍' };
    if (rr >= 1.0) return { color: 'amber', label: 'Fair', icon: '⚠️' };
    return { color: 'red', label: 'Needs Improvement', icon: '📉' };
  };

  const rrQuality = getRRQuality(data.suggestedRR);

  // Determine if current win rate is sufficient
  const hasEdge = data.currentWinRate > data.breakEvenWinRate;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Main Recommendation Card */}
      <Card className={`border-${rrQuality.color}-300 bg-gradient-to-br from-${rrQuality.color}-50 to-${rrQuality.color}-100/50`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-${rrQuality.color}-500 text-white`}>
              <Scale className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold text-${rrQuality.color}-900 mb-1`}>
                Suggested Risk:Reward Setup
              </h3>
              <div className="flex items-baseline gap-3 mb-3">
                <span className={`text-3xl font-bold text-${rrQuality.color}-600`}>
                  {formatRatio(data.suggestedRR)}
                </span>
                <span className="text-lg">{rrQuality.icon}</span>
                <span className={`text-lg text-${rrQuality.color}-500`}>
                  {rrQuality.label}
                </span>
              </div>
              <p className={`text-sm text-${rrQuality.color}-700 leading-relaxed`}>
                {data.comparison}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suggested Stop */}
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-900">Suggested Stop Loss</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.suggestedStop)}
                </p>
                <p className="text-sm text-red-600">
                  {formatPoints(data.suggestedStopPoints)}
                </p>
              </div>
              <p className="text-xs text-red-700 leading-relaxed">
                Based on your MAE analysis
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Target */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Suggested Take Profit</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.suggestedTarget)}
                </p>
                <p className="text-sm text-green-600">
                  {formatPoints(data.suggestedTargetPoints)}
                </p>
              </div>
              <p className="text-xs text-green-700 leading-relaxed">
                Based on your MFE analysis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current vs Suggested Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current R:R */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Current R:R</h4>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatRatio(data.currentAvgRR)}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Your historical average
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Win Rate */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Win Rate</h4>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {data.currentWinRate.toFixed(1)}%
              </p>
              <p className="text-xs text-purple-700 mt-2">
                Current performance
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Expectancy */}
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <h4 className="font-semibold text-indigo-900">Expectancy</h4>
            </div>
            <div>
              <p className={`text-2xl font-bold ${data.currentExpectancy >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                {formatCurrency(data.currentExpectancy)}
              </p>
              <p className="text-xs text-indigo-700 mt-2">
                Per trade average
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Break-Even Analysis */}
      <Card className={`border-${hasEdge ? 'green' : 'amber'}-200 bg-${hasEdge ? 'green' : 'amber'}-50/50`}>
        <CardContent className="pt-6">
          <h4 className={`font-semibold text-${hasEdge ? 'green' : 'amber'}-900 mb-4 flex items-center gap-2`}>
            <Scale className={`h-5 w-5 text-${hasEdge ? 'green' : 'amber'}-600`} />
            Break-Even Analysis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Required Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.breakEvenWinRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                To break even with {formatRatio(data.suggestedRR)}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Expected P&L per Trade</p>
              <p className={`text-2xl font-bold ${data.expectedPnLPerTrade >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.expectedPnLPerTrade)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                With suggested setup
              </p>
            </div>
          </div>
          {hasEdge ? (
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Your {data.currentWinRate.toFixed(1)}% win rate exceeds the required {data.breakEvenWinRate.toFixed(1)}% - you have a positive edge!
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-amber-100 rounded-lg">
              <p className="text-sm text-amber-800">
                ⚠️ Your {data.currentWinRate.toFixed(1)}% win rate is below the required {data.breakEvenWinRate.toFixed(1)}%. Focus on trade quality or adjust R:R.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Recommendation */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            How to Apply
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Use <strong>{formatRatio(data.suggestedRR)}</strong> as your minimum acceptable setup
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Only take trades where you can achieve at least <strong>{formatCurrency(data.suggestedTarget)}</strong> target
                with <strong>{formatCurrency(data.suggestedStop)}</strong> risk
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                With your {data.currentWinRate.toFixed(1)}% win rate, this setup yields <strong>{formatCurrency(data.expectedPnLPerTrade)}</strong> per trade
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                If you can't achieve this R:R, either improve entry quality or skip the trade
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>
                Track every trade against this benchmark and adjust quarterly
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RiskRewardSetupTab;
