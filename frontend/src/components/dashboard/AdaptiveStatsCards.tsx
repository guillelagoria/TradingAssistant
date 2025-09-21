import React from 'react';
import { motion } from 'framer-motion';
import { useAccountStats } from '../../hooks/useAccountStats';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import DataQualityBadge from '../shared/DataQualityBadge';
import CapabilityTooltip from '../shared/CapabilityTooltip';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity, Zap, Clock } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isAdvanced?: boolean;
  available?: boolean;
  tooltip?: {
    available: string[];
    missing: string[];
    recommendations?: Array<{
      type: 'upgrade' | 'import' | 'complete';
      message: string;
      action: string;
    }>;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  icon,
  trend = 'neutral',
  isAdvanced = false,
  available = true,
  tooltip
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
        available
          ? 'bg-white hover:bg-gray-50 border-gray-200'
          : 'bg-gray-50 hover:bg-gray-100 border-gray-300 opacity-60'
      } ${isAdvanced ? 'border-l-4 border-l-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            available
              ? isAdvanced
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600'
              : 'bg-gray-200 text-gray-400'
          }`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm font-medium ${
                available ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {title}
              </h3>
              {isAdvanced && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                  Advanced
                </span>
              )}
            </div>
            <div className={`mt-1 ${
              available ? 'text-2xl font-bold text-gray-900' : 'text-2xl font-bold text-gray-400'
            }`}>
              {available ? value : '—'}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-sm ${
                available ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {available ? description : 'Not available with current data'}
              </p>
              {available && getTrendIcon()}
            </div>
          </div>
        </div>
      </div>

      {!available && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-xs text-yellow-700">
            📄 Import NT8 CSV data to unlock this metric
          </div>
        </div>
      )}
    </motion.div>
  );

  if (tooltip) {
    return (
      <CapabilityTooltip
        available={tooltip.available}
        missing={tooltip.missing}
        recommendations={tooltip.recommendations}
      >
        {cardContent}
      </CapabilityTooltip>
    );
  }

  return cardContent;
};

const AdaptiveStatsCards: React.FC = () => {
  const { activeAccount } = useAccountStore();
  const { stats, loading: statsLoading } = useAccountStats(activeAccount?.id || null);
  const { capabilities, adaptiveStats, loading: capabilitiesLoading } = useDataCapabilities(activeAccount?.id || null);

  if (statsLoading || capabilitiesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats || !capabilities) {
    return (
      <div className="text-center py-8 text-gray-500">
        Unable to load trading statistics
      </div>
    );
  }

  const features = adaptiveStats?.adaptiveFeatures || {
    showAdvancedMetrics: false,
    showEfficiencyAnalysis: false,
    showTimingAnalysis: false,
    showStrategyBreakdown: false
  };

  // Basic stats (always available)
  const basicStats = [
    {
      title: 'Total P&L',
      value: `$${(stats.totalNetPnL || 0).toFixed(2)}`,
      description: 'Net profit/loss',
      icon: <DollarSign className="w-5 h-5" />,
      trend: (stats.totalNetPnL || 0) > 0 ? 'up' as const : (stats.totalNetPnL || 0) < 0 ? 'down' as const : 'neutral' as const
    },
    {
      title: 'Win Rate',
      value: `${(stats.winRate || 0).toFixed(1)}%`,
      description: 'Percentage of winning trades',
      icon: <Target className="w-5 h-5" />,
      trend: (stats.winRate || 0) > 50 ? 'up' as const : 'down' as const
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades || 0,
      description: 'Number of trades executed',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      title: 'Profit Factor',
      value: (stats.profitFactor || 0).toFixed(2),
      description: 'Ratio of gross profit to gross loss',
      icon: <Activity className="w-5 h-5" />,
      trend: (stats.profitFactor || 0) > 1 ? 'up' as const : 'down' as const
    }
  ];

  // Advanced stats (conditional)
  const advancedStats = [];

  if (features.showAdvancedMetrics && stats.advancedMetrics) {
    advancedStats.push(
      {
        title: 'MFE Efficiency',
        value: `${stats.advancedMetrics.avgMFEEfficiency.toFixed(1)}%`,
        description: 'Average capture of favorable moves',
        icon: <Zap className="w-5 h-5" />,
        isAdvanced: true,
        available: true,
        tooltip: {
          available: capabilities.availableMetrics.advanced.filter(m => m.includes('MFE')),
          missing: capabilities.availableMetrics.missing.filter(m => m.includes('MFE')),
          recommendations: capabilities.recommendations
        }
      },
      {
        title: 'MAE Efficiency',
        value: `${stats.advancedMetrics.avgMAEEfficiency.toFixed(1)}%`,
        description: 'Average avoidance of adverse moves',
        icon: <Target className="w-5 h-5" />,
        isAdvanced: true,
        available: true,
        tooltip: {
          available: capabilities.availableMetrics.advanced.filter(m => m.includes('MAE')),
          missing: capabilities.availableMetrics.missing.filter(m => m.includes('MAE')),
          recommendations: capabilities.recommendations
        }
      }
    );
  } else {
    // Show placeholder for unavailable advanced metrics
    advancedStats.push(
      {
        title: 'MFE Efficiency',
        value: '—',
        description: 'Average capture of favorable moves',
        icon: <Zap className="w-5 h-5" />,
        isAdvanced: true,
        available: false,
        tooltip: {
          available: capabilities.availableMetrics.advanced,
          missing: capabilities.availableMetrics.missing,
          recommendations: capabilities.recommendations
        }
      },
      {
        title: 'Risk Realization',
        value: '—',
        description: 'Percentage of stop loss hit',
        icon: <Activity className="w-5 h-5" />,
        isAdvanced: true,
        available: false,
        tooltip: {
          available: capabilities.availableMetrics.advanced,
          missing: capabilities.availableMetrics.missing,
          recommendations: capabilities.recommendations
        }
      }
    );
  }

  if (features.showTimingAnalysis) {
    advancedStats.push({
      title: 'Avg Duration',
      value: '—', // Would need to calculate from duration data
      description: 'Average trade duration',
      icon: <Clock className="w-5 h-5" />,
      isAdvanced: true,
      available: capabilities.availableMetrics.advanced.some(m => m.includes('Duration')),
      tooltip: {
        available: capabilities.availableMetrics.advanced.filter(m => m.includes('Duration')),
        missing: capabilities.availableMetrics.missing.filter(m => m.includes('Duration')),
        recommendations: capabilities.recommendations
      }
    });
  }

  const allStats = [...basicStats, ...advancedStats];

  return (
    <div className="space-y-6">
      {/* Data Quality Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Trading Statistics</h2>
        <DataQualityBadge
          score={capabilities.capabilityScore}
          breakdown={capabilities.dataQualityBreakdown}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {allStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
            isAdvanced={stat.isAdvanced}
            available={stat.available}
            tooltip={stat.tooltip}
          />
        ))}
      </div>

      {/* Recommendations Section */}
      {capabilities.recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 Unlock More Insights</h3>
          <div className="space-y-2">
            {capabilities.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-blue-600 mt-0.5">
                  {rec.type === 'import' ? '📄' : rec.type === 'upgrade' ? '⚡' : '🎯'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-900">{rec.message}</div>
                  <div className="text-xs text-blue-700">{rec.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveStatsCards;