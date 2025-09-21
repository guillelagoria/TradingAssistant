import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import {
  ArrowRight,
  CheckCircle,
  X,
  Zap,
  Clock,
  Target,
  BarChart3,
  TrendingUp,
  Star,
  Lock,
  Upload
} from 'lucide-react';

interface ComparisonMetric {
  name: string;
  icon: React.ReactNode;
  current: {
    available: boolean;
    value?: string;
    description: string;
  };
  upgraded: {
    available: boolean;
    value?: string;
    description: string;
  };
  category: 'basic' | 'advanced' | 'premium';
}

interface DataUpgradeComparisonProps {
  onStartUpgrade: () => void;
  onClose: () => void;
  upgradeType: 'import' | 'enable_tracking' | 'complete_setup';
}

const DataUpgradeComparison: React.FC<DataUpgradeComparisonProps> = ({
  onStartUpgrade,
  onClose,
  upgradeType
}) => {
  const { activeAccount } = useAccountStore();
  const { capabilities, loading } = useDataCapabilities(activeAccount?.id || null);

  const getUpgradeTitle = () => {
    switch (upgradeType) {
      case 'import': return 'Import NT8 Data';
      case 'enable_tracking': return 'Enable Advanced Tracking';
      case 'complete_setup': return 'Complete Analytics Setup';
      default: return 'Upgrade Analytics';
    }
  };

  const getUpgradeDescription = () => {
    switch (upgradeType) {
      case 'import': return 'See what you\'ll unlock by importing your NinjaTrader 8 CSV data';
      case 'enable_tracking': return 'See what you\'ll gain by enabling MAE/MFE tracking';
      case 'complete_setup': return 'See the full potential of your trading analytics';
      default: return 'Compare your current analytics with what\'s possible';
    }
  };

  const generateMetrics = (): ComparisonMetric[] => {
    if (!capabilities) return [];

    const hasMAE = capabilities.availableMetrics.advanced.some(m => m.includes('MAE'));
    const hasMFE = capabilities.availableMetrics.advanced.some(m => m.includes('MFE'));
    const hasTiming = capabilities.availableMetrics.advanced.some(m => m.includes('Duration'));
    const hasStrategy = capabilities.availableMetrics.advanced.some(m => m.includes('Strategy'));

    return [
      {
        name: 'Basic Analytics',
        icon: <BarChart3 className="w-5 h-5" />,
        category: 'basic',
        current: {
          available: true,
          value: '✓ Available',
          description: 'P&L, Win Rate, Basic Stats'
        },
        upgraded: {
          available: true,
          value: '✓ Enhanced',
          description: 'Improved accuracy with detailed data'
        }
      },
      {
        name: 'MAE Analysis',
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'advanced',
        current: {
          available: hasMAE,
          value: hasMAE ? '✓ Available' : '✗ Not Available',
          description: hasMAE ? 'Basic MAE tracking' : 'Maximum Adverse Excursion tracking missing'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'Detailed maximum adverse excursion analysis'
        }
      },
      {
        name: 'MFE Analysis',
        icon: <Zap className="w-5 h-5" />,
        category: 'advanced',
        current: {
          available: hasMFE,
          value: hasMFE ? '✓ Available' : '✗ Not Available',
          description: hasMFE ? 'Basic MFE tracking' : 'Maximum Favorable Excursion tracking missing'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'Detailed maximum favorable excursion analysis'
        }
      },
      {
        name: 'Trade Efficiency',
        icon: <Target className="w-5 h-5" />,
        category: 'advanced',
        current: {
          available: hasMAE && hasMFE,
          value: hasMAE && hasMFE ? '✓ Available' : '✗ Not Available',
          description: hasMAE && hasMFE ? 'Basic efficiency metrics' : 'Requires MAE/MFE data'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'Advanced efficiency scoring and optimization insights'
        }
      },
      {
        name: 'Duration Analysis',
        icon: <Clock className="w-5 h-5" />,
        category: 'advanced',
        current: {
          available: hasTiming,
          value: hasTiming ? '✓ Available' : '✗ Not Available',
          description: hasTiming ? 'Basic duration tracking' : 'Trade timing data missing'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'Detailed timing patterns and optimization'
        }
      },
      {
        name: 'Strategy Performance',
        icon: <Star className="w-5 h-5" />,
        category: 'premium',
        current: {
          available: hasStrategy,
          value: hasStrategy ? '✓ Available' : '✗ Not Available',
          description: hasStrategy ? 'Basic strategy grouping' : 'Strategy metadata missing'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'Comprehensive strategy comparison and optimization'
        }
      },
      {
        name: 'Risk Management',
        icon: <Target className="w-5 h-5" />,
        category: 'premium',
        current: {
          available: capabilities.capabilityScore > 60,
          value: capabilities.capabilityScore > 60 ? '✓ Basic' : '✗ Limited',
          description: 'Basic risk metrics available'
        },
        upgraded: {
          available: true,
          value: '✓ Advanced',
          description: 'Advanced risk analysis with MAE/MFE insights'
        }
      },
      {
        name: 'Performance Optimization',
        icon: <TrendingUp className="w-5 h-5" />,
        category: 'premium',
        current: {
          available: false,
          value: '✗ Not Available',
          description: 'Requires complete data for optimization insights'
        },
        upgraded: {
          available: true,
          value: '✓ Available',
          description: 'AI-powered suggestions for trade improvement'
        }
      }
    ];
  };

  const metrics = generateMetrics();
  const currentScore = capabilities?.capabilityScore || 0;
  const projectedScore = Math.min(currentScore + 30, 100); // Estimate upgrade impact

  const getCategoryColor = (category: 'basic' | 'advanced' | 'premium') => {
    switch (category) {
      case 'basic': return 'bg-green-100 text-green-700';
      case 'advanced': return 'bg-blue-100 text-blue-700';
      case 'premium': return 'bg-purple-100 text-purple-700';
    }
  };

  if (loading || !capabilities) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <span>{getUpgradeTitle()}</span>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  {getUpgradeDescription()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{currentScore}%</div>
                  <div className="text-sm text-muted-foreground">Current Quality</div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-blue-500" />
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{projectedScore}%</div>
                  <div className="text-sm text-blue-700">After Upgrade</div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Comparison */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Feature Comparison</h3>

              <div className="space-y-3">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                  >
                    {/* Metric Info */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {metric.icon}
                      </div>
                      <div>
                        <div className="font-medium flex items-center space-x-2">
                          <span>{metric.name}</span>
                          <Badge className={getCategoryColor(metric.category)}>
                            {metric.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Current State */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {metric.current.available ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          metric.current.available ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {metric.current.value}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.current.description}
                      </div>
                    </div>

                    {/* Upgraded State */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {metric.upgraded.available ? (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          metric.upgraded.available ? 'text-blue-700' : 'text-gray-500'
                        }`}>
                          {metric.upgraded.value}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600">
                        {metric.upgraded.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Benefits Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">🚀 What You'll Gain</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Advanced exit timing optimization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Risk management insights</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Strategy performance comparison</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Trade duration analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Efficiency scoring</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">AI-powered recommendations</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Upgrade takes less than 5 minutes • Free feature
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Maybe Later
                </Button>
                <Button onClick={onStartUpgrade} className="flex items-center space-x-2">
                  <span>Start Upgrade</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DataUpgradeComparison;