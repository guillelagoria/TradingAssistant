import { motion } from 'framer-motion';
import { Clock, TrendingUp, TrendingDown, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { TimingEfficiency } from '../../types/optimization';
import { Card, CardContent } from '../ui/card';

interface Props {
  data: TimingEfficiency | null;
}

const TimingEfficiencyTab = ({ data }: Props) => {
  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Not enough data to generate timing recommendations.</p>
        <p className="text-sm mt-2">Continue trading with duration tracking enabled.</p>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Main Insight Card */}
      <Card className="border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-violet-100/50 dark:from-purple-950/30 dark:to-violet-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-500 dark:bg-purple-600 text-white">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-1">Timing Insights</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                {data.insight}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Entry Hours */}
      {data.bestEntryHours.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Best Trading Hours
            </h4>
            <div className="space-y-3">
              {data.bestEntryHours.map((hour, index) => (
                <div
                  key={hour.hour}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        {formatHour(hour.hour)} - {formatHour(hour.hour + 1)}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {hour.trades} trades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${hour.avgPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${Math.abs(hour.avgPnL).toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {hour.winRate.toFixed(0)}% win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duration Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winners Duration */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Winning Trades</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Average duration</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatDuration(data.avgDurationWinners)}
                </p>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                Typical hold time for profitable trades
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Losers Duration */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h4 className="font-semibold text-red-900 dark:text-red-100">Losing Trades</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Average duration</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatDuration(data.avgDurationLosers)}
                </p>
              </div>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                Typical hold time for losing trades
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Stop Suggestion */}
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-amber-500 dark:bg-amber-600 text-white">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Suggested Time Stop</h4>
              <div className="mb-3">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {formatDuration(data.suggestedTimeStop)}
                </p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                If your trade hasn't shown momentum within this timeframe, consider exiting.
                This is based on 50% of your average winning trade duration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break-Even Statistics */}
      {data.breakEvenStats.reachedBE > 0 && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Break-Even Performance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Reached Break-Even</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {data.breakEvenStats.reachedBEPercent.toFixed(0)}%
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                  {data.breakEvenStats.reachedBE} trades
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-1">Continued to Profit</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {data.breakEvenStats.continuedProfitPercent.toFixed(0)}%
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                  {data.breakEvenStats.continuedProfit} of {data.breakEvenStats.reachedBE} BE trades
                </p>
              </div>
            </div>
            {data.breakEvenStats.continuedProfitPercent > 60 ? (
              <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ {data.breakEvenStats.continuedProfitPercent.toFixed(0)}% of your BE trades become profitable.
                  Moving stops to BE is working well for you!
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ Only {data.breakEvenStats.continuedProfitPercent.toFixed(0)}% of BE trades continue to profit.
                  Consider tightening stops or taking partial profits earlier.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Recommendation */}
      <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            How to Apply
          </h4>
          <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                Focus your trading during {data.bestEntryHours.length > 0 ? `${formatHour(data.bestEntryHours[0].hour)} - ${formatHour(data.bestEntryHours[0].hour + 1)}` : 'your best performing hours'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                Set a <strong>{formatDuration(data.suggestedTimeStop)}</strong> time stop - exit if trade lacks momentum
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                Winners typically develop within <strong>{formatDuration(data.avgDurationWinners)}</strong>
              </span>
            </li>
            {data.avgDurationLosers < data.avgDurationWinners && (
              <li className="flex items-start gap-2">
                <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                <span>
                  Your losers resolve faster ({formatDuration(data.avgDurationLosers)}) - good sign you're cutting losses quickly
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <span>
                Avoid trading during low-performance hours to improve overall results
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Add Scale import if not already present
const Scale = Clock; // Reuse Clock for simplicity

export default TimingEfficiencyTab;
