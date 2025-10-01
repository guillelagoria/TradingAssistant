import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertCircle, Lightbulb, DollarSign } from 'lucide-react';
import { TakeProfitOptimization } from '../../types/optimization';
import { Card, CardContent } from '../ui/card';

interface Props {
  data: TakeProfitOptimization | null;
}

const TakeProfitOptimizationTab = ({ data }: Props) => {
  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Not enough data to generate take profit recommendations.</p>
        <p className="text-sm mt-2">Continue trading with MFE tracking enabled.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${Math.abs(value).toFixed(2)}`;
  const formatPoints = (value: number) => `${Math.abs(value).toFixed(2)} pts`;

  // Determine capture rate quality
  const getCaptureRateQuality = (rate: number) => {
    if (rate >= 70) return { color: 'green', label: 'Excellent', icon: '🎯' };
    if (rate >= 60) return { color: 'blue', label: 'Good', icon: '👍' };
    if (rate >= 50) return { color: 'amber', label: 'Fair', icon: '⚠️' };
    return { color: 'red', label: 'Needs Improvement', icon: '📉' };
  };

  const captureQuality = getCaptureRateQuality(data.captureRate);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Main Recommendation Card */}
      <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-100/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-green-500 text-white">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-1">Recommended Take Profit</h3>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.recommendedTarget)}
                </span>
                <span className="text-xl text-green-500">
                  ({formatPoints(data.recommendedTargetPoints)})
                </span>
              </div>
              <p className="text-sm text-green-700 leading-relaxed">
                {data.insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MFE Achieved */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Average MFE</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-blue-700">Maximum favorable excursion</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.avgMFEAchieved)}
                </p>
                <p className="text-sm text-blue-600">
                  {formatPoints(data.avgMFEPoints)}
                </p>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                Your trades typically reach this profit level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Capture Rate */}
        <Card className={`border-${captureQuality.color}-200 bg-${captureQuality.color}-50/50`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className={`h-5 w-5 text-${captureQuality.color}-600`} />
              <h4 className={`font-semibold text-${captureQuality.color}-900`}>Profit Capture Rate</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className={`text-sm text-${captureQuality.color}-700`}>
                  Current capture efficiency
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-bold text-${captureQuality.color}-600`}>
                    {data.captureRate.toFixed(0)}%
                  </p>
                  <span className="text-lg">{captureQuality.icon}</span>
                </div>
                <p className={`text-sm text-${captureQuality.color}-600`}>
                  {captureQuality.label}
                </p>
              </div>
              <p className={`text-xs text-${captureQuality.color}-700 leading-relaxed`}>
                Percentage of MFE you're actually capturing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Potential Left on Table */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-amber-600" />
              <h4 className="font-semibold text-amber-900">Unrealized Profit</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-amber-700">Left on the table (avg)</p>
                <p className="text-2xl font-bold text-amber-600">
                  {formatCurrency(data.potentialLeftOnTable)}
                </p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                {data.potentialLeftOnTable > 0
                  ? 'Opportunity to improve exit timing'
                  : 'Your exits are well-optimized'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actual Exit vs MFE */}
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Actual Exit P&L</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-purple-700">Average exit profit</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.avgExitMFE)}
                </p>
              </div>
              <p className="text-xs text-purple-700 leading-relaxed">
                What you're actually making on average
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partial Exit Strategy */}
      <Card className="border-indigo-200 bg-indigo-50/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
            Partial Exit Strategy
          </h4>
          <div className="p-4 bg-white rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-800 leading-relaxed">
              {data.partialExitSuggestion}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendation */}
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            How to Apply
          </h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>
                Set initial target at <strong>{formatCurrency(data.recommendedTarget)}</strong> ({formatPoints(data.recommendedTargetPoints)})
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>
                This captures ~72% of your average MFE (professional capture rate)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>
                Consider partial exits: take 50% at first target, trail remaining position
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>
                Use trailing stops to maximize profit capture while protecting gains
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">•</span>
              <span>
                Track your capture rate over time - aim for 65-75% consistency
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TakeProfitOptimizationTab;
