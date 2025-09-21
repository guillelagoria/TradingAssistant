import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import {
  Trophy,
  Star,
  Zap,
  Target,
  BarChart3,
  TrendingUp,
  Upload,
  Clock,
  Award,
  CheckCircle,
  Lock
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'data_quality' | 'analytics' | 'trading' | 'engagement';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward?: string;
  nextMilestone?: string;
}

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, onClick }) => {
  const getTierColor = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return 'from-amber-400 to-amber-600';
      case 'silver': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
    }
  };

  const getTierIcon = (tier: Achievement['tier']) => {
    switch (tier) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        achievement.unlocked
          ? 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg'
          : 'bg-gray-50 border-gray-200 opacity-80'
      }`}>
        {achievement.unlocked && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getTierColor(achievement.tier)} text-white`}>
              {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className={`text-sm ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {getTierIcon(achievement.tier)} {achievement.tier}
                </Badge>
              </div>
              <p className={`text-xs mt-1 ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                {achievement.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.maxProgress}</span>
              </div>
              <Progress
                value={(achievement.progress / achievement.maxProgress) * 100}
                className="h-2"
              />
            </div>

            {/* Reward */}
            {achievement.reward && achievement.unlocked && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="text-xs text-yellow-700">
                  🎁 <strong>Reward:</strong> {achievement.reward}
                </div>
              </div>
            )}

            {/* Next Milestone */}
            {achievement.nextMilestone && !achievement.unlocked && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs text-blue-700">
                  🎯 <strong>Next:</strong> {achievement.nextMilestone}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DataQualityAchievements: React.FC = () => {
  const { activeAccount } = useAccountStore();
  const { capabilities, loading } = useDataCapabilities(activeAccount?.id || null);
  const [selectedCategory, setSelectedCategory] = useState<Achievement['category'] | 'all'>('all');

  const generateAchievements = (): Achievement[] => {
    if (!capabilities) return [];

    const achievements: Achievement[] = [
      // Data Quality Achievements
      {
        id: 'first_trades',
        title: 'Getting Started',
        description: 'Add your first 5 trades',
        icon: <BarChart3 className="w-5 h-5" />,
        tier: 'bronze',
        category: 'data_quality',
        progress: Math.min(capabilities.totalTrades, 5),
        maxProgress: 5,
        unlocked: capabilities.totalTrades >= 5,
        reward: 'Basic analytics unlocked',
        nextMilestone: capabilities.totalTrades < 5 ? `Add ${5 - capabilities.totalTrades} more trades` : undefined
      },
      {
        id: 'quality_explorer',
        title: 'Quality Explorer',
        description: 'Reach 50% data quality score',
        icon: <Star className="w-5 h-5" />,
        tier: 'silver',
        category: 'data_quality',
        progress: capabilities.capabilityScore,
        maxProgress: 50,
        unlocked: capabilities.capabilityScore >= 50,
        reward: 'Advanced metrics preview',
        nextMilestone: capabilities.capabilityScore < 50 ? 'Import NT8 data or add MAE/MFE tracking' : undefined
      },
      {
        id: 'data_master',
        title: 'Data Master',
        description: 'Achieve 80% data quality score',
        icon: <Trophy className="w-5 h-5" />,
        tier: 'gold',
        category: 'data_quality',
        progress: capabilities.capabilityScore,
        maxProgress: 80,
        unlocked: capabilities.capabilityScore >= 80,
        reward: 'All premium analytics unlocked',
        nextMilestone: capabilities.capabilityScore < 80 ? 'Import complete NT8 CSV data' : undefined
      },

      // Analytics Achievements
      {
        id: 'efficiency_tracker',
        title: 'Efficiency Tracker',
        description: 'Enable MAE/MFE tracking',
        icon: <Zap className="w-5 h-5" />,
        tier: 'bronze',
        category: 'analytics',
        progress: capabilities.availableMetrics.advanced.filter(m => m.includes('MAE') || m.includes('MFE')).length,
        maxProgress: 2,
        unlocked: capabilities.availableMetrics.advanced.some(m => m.includes('MAE') || m.includes('MFE')),
        reward: 'Entry/exit timing insights',
        nextMilestone: 'Import NT8 data or manually track MAE/MFE'
      },
      {
        id: 'timing_analyst',
        title: 'Timing Analyst',
        description: 'Unlock duration analysis',
        icon: <Clock className="w-5 h-5" />,
        tier: 'silver',
        category: 'analytics',
        progress: capabilities.availableMetrics.advanced.filter(m => m.includes('Duration')).length,
        maxProgress: 1,
        unlocked: capabilities.availableMetrics.advanced.some(m => m.includes('Duration')),
        reward: 'Trade timing optimization',
        nextMilestone: 'Import NT8 data with timing information'
      },
      {
        id: 'strategy_guru',
        title: 'Strategy Guru',
        description: 'Enable strategy performance breakdown',
        icon: <Target className="w-5 h-5" />,
        tier: 'gold',
        category: 'analytics',
        progress: capabilities.availableMetrics.advanced.filter(m => m.includes('Strategy')).length,
        maxProgress: 1,
        unlocked: capabilities.availableMetrics.advanced.some(m => m.includes('Strategy')),
        reward: 'Strategy comparison and optimization',
        nextMilestone: 'Import NT8 data with strategy metadata'
      },

      // Trading Achievements
      {
        id: 'consistent_trader',
        title: 'Consistent Trader',
        description: 'Record 25 trades',
        icon: <TrendingUp className="w-5 h-5" />,
        tier: 'bronze',
        category: 'trading',
        progress: Math.min(capabilities.totalTrades, 25),
        maxProgress: 25,
        unlocked: capabilities.totalTrades >= 25,
        reward: 'Trend analysis unlocked'
      },
      {
        id: 'active_trader',
        title: 'Active Trader',
        description: 'Record 100 trades',
        icon: <BarChart3 className="w-5 h-5" />,
        tier: 'silver',
        category: 'trading',
        progress: Math.min(capabilities.totalTrades, 100),
        maxProgress: 100,
        unlocked: capabilities.totalTrades >= 100,
        reward: 'Advanced statistical analysis'
      },
      {
        id: 'veteran_trader',
        title: 'Veteran Trader',
        description: 'Record 500 trades',
        icon: <Award className="w-5 h-5" />,
        tier: 'gold',
        category: 'trading',
        progress: Math.min(capabilities.totalTrades, 500),
        maxProgress: 500,
        unlocked: capabilities.totalTrades >= 500,
        reward: 'Predictive analytics access'
      },

      // Engagement Achievements
      {
        id: 'data_importer',
        title: 'Data Importer',
        description: 'Import NT8 CSV data',
        icon: <Upload className="w-5 h-5" />,
        tier: 'silver',
        category: 'engagement',
        progress: capabilities.dataQualityBreakdown.complete > 0 ? 1 : 0,
        maxProgress: 1,
        unlocked: capabilities.dataQualityBreakdown.complete > 0,
        reward: 'Advanced analytics suite'
      }
    ];

    return achievements;
  };

  const achievements = generateAchievements();
  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;

  const categories = [
    { key: 'all' as const, label: 'All', icon: <Trophy className="w-4 h-4" /> },
    { key: 'data_quality' as const, label: 'Data Quality', icon: <Star className="w-4 h-4" /> },
    { key: 'analytics' as const, label: 'Analytics', icon: <Zap className="w-4 h-4" /> },
    { key: 'trading' as const, label: 'Trading', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'engagement' as const, label: 'Engagement', icon: <Upload className="w-4 h-4" /> },
  ];

  if (loading || !capabilities) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🏆 Achievements</h2>
        <p className="text-muted-foreground mb-4">
          Unlock new features and insights as you improve your trading data
        </p>
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{unlockedCount}</div>
            <div className="text-xs text-muted-foreground">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{totalAchievements - unlockedCount}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((unlockedCount / totalAchievements) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button
            key={category.key}
            variant={selectedCategory === category.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.key)}
            className="flex items-center space-x-2"
          >
            {category.icon}
            <span>{category.label}</span>
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <AchievementCard achievement={achievement} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-4">🚀 Quick Actions to Unlock More</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {capabilities.recommendations.slice(0, 3).map((rec, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">
                  {rec.type === 'import' ? '📄' : rec.type === 'upgrade' ? '⚡' : '🎯'}
                </span>
                <div className="text-sm font-medium">{rec.message}</div>
              </div>
              <div className="text-xs text-muted-foreground">{rec.action}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataQualityAchievements;