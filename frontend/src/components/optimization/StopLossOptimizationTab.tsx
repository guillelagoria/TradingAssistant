import { motion } from 'framer-motion';
import { Shield, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StopLossOptimization } from '../../types/optimization';
import { Card, CardContent } from '../ui/card';

interface Props {
  data: StopLossOptimization | null;
}

const StopLossOptimizationTab = ({ data }: Props) => {
  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Not enough data to generate stop loss recommendations.</p>
        <p className="text-sm mt-2">Continue trading with MAE/MFE tracking enabled.</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${Math.abs(value).toFixed(2)}`;
  const formatPoints = (value: number) => `${Math.abs(value).toFixed(2)} pts`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Main Recommendation Card */}
      <Card className="border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-blue-500 dark:bg-blue-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">Recommended Stop Loss</h3>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.recommendedStop)}
                </span>
                <span className="text-xl text-blue-500 dark:text-blue-300">
                  ({formatPoints(data.recommendedStopPoints)})
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                {data.insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winners MAE */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Winning Trades</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Average MAE</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(data.avgMAEWinners)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {formatPoints(data.avgMAEWinnersPoints)}
                </p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                Most winners stayed within this adverse excursion
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Losers MAE */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h4 className="font-semibold text-red-900 dark:text-red-100">Losing Trades</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Average MAE</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(data.avgMAELosers)}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formatPoints(data.avgMAELosersPoints)}
                </p>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                Typical adverse movement in losing trades
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stops Avoided */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">Premature Stops</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">Could be avoided</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {data.stopsAvoidedPercent.toFixed(0)}%
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {data.stopsAvoided} trades
                </p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Winners that would survive with recommended stop
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 75th Percentile */}
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Statistical Basis</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">75th Percentile MAE</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(data.percentile75MAE)}
                </p>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                75% of winners had MAE below this level (+ 15% buffer)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Recommendation */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            How to Apply
          </h4>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>
                Use <strong>{formatCurrency(data.recommendedStop)}</strong> ({formatPoints(data.recommendedStopPoints)}) as your standard stop loss
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>
                Adjust based on current volatility and market conditions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>
                This level protects {data.stopsAvoidedPercent.toFixed(0)}% of your winning trades from premature exits
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>
                Review and adjust every 20-30 trades as your trading evolves
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StopLossOptimizationTab;
