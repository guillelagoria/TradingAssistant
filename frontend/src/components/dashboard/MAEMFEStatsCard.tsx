import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingDown, TrendingUp, Activity, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeStore } from '@/store/tradeStore';

export function MAEMFEStatsCard() {
  const { trades } = useTradeStore();

  // Calculate MAE/MFE statistics
  const stats = React.useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        avgMAE: 0,
        avgMFE: 0,
        avgETD: 0,
        maeEfficiency: 0,
        mfeEfficiency: 0,
        avgMAEWinners: 0,
        avgMAELosers: 0,
        avgMFEWinners: 0,
        avgMFELosers: 0,
      };
    }

    const validTrades = trades.filter(t =>
      t.maxAdversePrice !== null && t.maxAdversePrice !== undefined &&
      t.maxFavorablePrice !== null && t.maxFavorablePrice !== undefined
    );

    if (validTrades.length === 0) return {
      avgMAE: 0,
      avgMFE: 0,
      avgETD: 0,
      maeEfficiency: 0,
      mfeEfficiency: 0,
      avgMAEWinners: 0,
      avgMAELosers: 0,
      avgMFEWinners: 0,
      avgMFELosers: 0,
    };

    // Separate winners and losers
    const winners = validTrades.filter(t => t.netPnl > 0);
    const losers = validTrades.filter(t => t.netPnl < 0);

    // Calculate averages - MAE and MFE are already in dollars from NT8
    const avgMAE = validTrades.reduce((sum, t) => {
      // maxAdversePrice already contains MAE in dollars
      return sum + t.maxAdversePrice!;
    }, 0) / validTrades.length;

    const avgMFE = validTrades.reduce((sum, t) => {
      // maxFavorablePrice already contains MFE in dollars
      return sum + t.maxFavorablePrice!;
    }, 0) / validTrades.length;

    const avgETD = validTrades
      .filter(t => t.maxDrawdown !== null && t.maxDrawdown !== undefined)
      .reduce((sum, t, idx, arr) => sum + t.maxDrawdown! / arr.length, 0);

    // Calculate efficiency metrics
    const maeEfficiency = validTrades.reduce((sum, t) => {
      const mae = t.maxAdversePrice!; // Already in dollars

      if (mae === 0) return sum + 1; // No adverse movement = 100% efficiency
      // How much of the MAE was recovered in the final P&L
      const efficiency = t.netPnl > 0 ? 1 : Math.max(0, 1 + (t.netPnl / mae));
      return sum + efficiency;
    }, 0) / validTrades.length * 100;

    const mfeEfficiency = validTrades.reduce((sum, t) => {
      const mfe = t.maxFavorablePrice!; // Already in dollars

      if (mfe === 0) return sum; // No favorable movement = 0% efficiency
      // How much of the MFE was captured in the final P&L
      const efficiency = t.netPnl > 0 ? Math.min(1, t.netPnl / mfe) : 0;
      return sum + efficiency;
    }, 0) / validTrades.length * 100;

    // Winners and losers MAE/MFE (values already in dollars)
    const avgMAEWinners = winners.length > 0
      ? winners.reduce((sum, t) => sum + t.maxAdversePrice!, 0) / winners.length
      : 0;

    const avgMAELosers = losers.length > 0
      ? losers.reduce((sum, t) => sum + t.maxAdversePrice!, 0) / losers.length
      : 0;

    const avgMFEWinners = winners.length > 0
      ? winners.reduce((sum, t) => sum + t.maxFavorablePrice!, 0) / winners.length
      : 0;

    const avgMFELosers = losers.length > 0
      ? losers.reduce((sum, t) => sum + t.maxFavorablePrice!, 0) / losers.length
      : 0;

    return {
      avgMAE,
      avgMFE,
      avgETD,
      maeEfficiency,
      mfeEfficiency,
      avgMAEWinners,
      avgMAELosers,
      avgMFEWinners,
      avgMFELosers,
    };
  }, [trades]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Helper function to get point value based on symbol
  const getPointValue = (symbol: string) => {
    const symbolUpper = symbol.toUpperCase();
    if (symbolUpper.includes('ES') || symbolUpper.includes('MES')) return 50; // E-mini S&P 500
    if (symbolUpper.includes('NQ') || symbolUpper.includes('MNQ')) return 20; // E-mini Nasdaq
    if (symbolUpper.includes('YM') || symbolUpper.includes('MYM')) return 5;  // E-mini Dow
    if (symbolUpper.includes('RTY') || symbolUpper.includes('M2K')) return 10; // E-mini Russell
    return 50; // Default to ES value
  };

  // Format value showing both points and dollars
  const formatPointsAndDollars = (dollarValue: number, sampleTrade?: any) => {
    if (!sampleTrade || dollarValue === 0) return formatCurrency(dollarValue);

    const pointValue = getPointValue(sampleTrade.symbol);
    // For ES: $50 per point, so $125 = 2.5 points
    const points = dollarValue / pointValue;

    return `${points.toFixed(1)} pts (${formatCurrency(dollarValue)})`;
  };

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* MAE Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10" />
            <CardHeader className="relative pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Maximum Adverse Excursion
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help ml-auto" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <p className="font-semibold text-red-600">MAE - Pérdida Flotante Máxima</p>
                      <p className="text-sm">La mayor pérdida no realizada que experimentó cada trade antes del cierre.</p>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-green-600">✓ Qué SÍ interpretar:</p>
                        <p className="text-xs">• Qué tan lejos fue el precio contra ti</p>
                        <p className="text-xs">• Si tu stop loss está bien posicionado</p>
                        <p className="text-xs">• Tolerancia al riesgo necesaria</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-medium text-red-600">✗ Qué NO interpretar:</p>
                        <p className="text-xs">• No es tu pérdida final del trade</p>
                        <p className="text-xs">• No significa que tu estrategia es mala</p>
                        <p className="text-xs">• MAE alto puede ser normal en trades ganadores</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-red-600">
              {formatPointsAndDollars(stats.avgMAE, trades?.[0])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average MAE per trade
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Winners:</span>
                <span className="text-red-500">{formatCurrency(stats.avgMAEWinners)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Losers:</span>
                <span className="text-red-600">{formatCurrency(stats.avgMAELosers)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* MFE Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/10" />
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Maximum Favorable Excursion
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help ml-auto" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-green-600">MFE - Ganancia Flotante Máxima</p>
                    <p className="text-sm">La mayor ganancia no realizada que alcanzó cada trade antes del cierre.</p>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-600">✓ Qué SÍ interpretar:</p>
                      <p className="text-xs">• Potencial de ganancia que tuviste</p>
                      <p className="text-xs">• Si necesitas mejores exits</p>
                      <p className="text-xs">• Oportunidades de profit-taking perdidas</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-600">✗ Qué NO interpretar:</p>
                      <p className="text-xs">• No es dinero que "perdiste"</p>
                      <p className="text-xs">• No siempre puedes capturar el 100%</p>
                      <p className="text-xs">• MFE alto no significa mal trading</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-green-600">
              {formatPointsAndDollars(stats.avgMFE, trades?.[0])}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average MFE per trade
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Winners:</span>
                <span className="text-green-600">{formatCurrency(stats.avgMFEWinners)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Losers:</span>
                <span className="text-green-500">{formatCurrency(stats.avgMFELosers)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Efficiency Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10" />
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Trade Efficiency
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help ml-auto" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-600">Trade Efficiency - Eficiencia de Ejecución</p>
                    <p className="text-sm">Qué tan bien ejecutas tus trades comparado con el potencial máximo.</p>

                    <div className="space-y-1">
                      <p className="text-xs font-medium">• <span className="text-blue-600">MAE Recovery:</span> Qué tan bien te recuperas de pérdidas adversas</p>
                      <p className="text-xs font-medium">• <span className="text-purple-600">MFE Capture:</span> Qué % de la ganancia máxima capturas</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-600">✓ Qué SÍ interpretar:</p>
                      <p className="text-xs">• MFE Capture bajo = necesitas mejores exits</p>
                      <p className="text-xs">• MAE Recovery alto = buena gestión de riesgo</p>
                      <p className="text-xs">• Úsalo para comparar períodos</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-600">✗ Qué NO interpretar:</p>
                      <p className="text-xs">• 100% no es siempre posible ni necesario</p>
                      <p className="text-xs">• No compares con otros traders</p>
                      <p className="text-xs">• Depende de tu estilo de trading</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">MAE Recovery</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatPercentage(stats.maeEfficiency)}
                  </span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.maeEfficiency)}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">MFE Capture</span>
                  <span className="text-sm font-bold text-purple-600">
                    {formatPercentage(stats.mfeEfficiency)}
                  </span>
                </div>
                <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, stats.mfeEfficiency)}%` }}
                    transition={{ delay: 0.6, duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ETD Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-600/10" />
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              End Trade Drawdown
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help ml-auto" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold text-orange-600">ETD - Retroceso desde Máximo</p>
                    <p className="text-sm">Cuántos ticks/puntos retrocedió el precio desde su punto máximo favorable hasta el cierre.</p>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-green-600">✓ Qué SÍ interpretar:</p>
                      <p className="text-xs">• Qué tan cerca estuviste del timing perfecto</p>
                      <p className="text-xs">• Si necesitas trailing stops</p>
                      <p className="text-xs">• Calidad de tus exits</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-red-600">✗ Qué NO interpretar:</p>
                      <p className="text-xs">• ETD = 0 no siempre es posible</p>
                      <p className="text-xs">• No significa que saliste "mal"</p>
                      <p className="text-xs">• Algunos retrocesos son normales</p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-md mt-2">
                      <p className="text-xs text-orange-800 dark:text-orange-200">
                        <strong>Ejemplo:</strong> Si el máximo fue +5 puntos y cerraste en +3, tu ETD = 2 puntos.
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-orange-600">
              {stats.avgETD.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average ETD (ticks from MFE)
            </p>
            <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
              <p className="text-xs text-orange-800 dark:text-orange-200">
                Lower ETD indicates better exit timing relative to the maximum profit potential
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </TooltipProvider>
  );
}