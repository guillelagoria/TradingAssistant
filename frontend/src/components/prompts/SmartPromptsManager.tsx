import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import AdaptiveOnboarding from '../onboarding/AdaptiveOnboarding';
import GuidedNT8Import from '../import/GuidedNT8Import';
import DataUpgradeComparison from '../comparison/DataUpgradeComparison';
import DataQualityAchievements from '../achievements/DataQualityAchievements';
import {
  Upload,
  Zap,
  TrendingUp,
  X,
  Trophy,
  Target,
  BarChart3,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SmartPrompt {
  id: string;
  type: 'onboarding' | 'import' | 'upgrade' | 'achievement' | 'tip';
  priority: number; // Higher = more important
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  condition: (capabilities: any) => boolean;
  dismissible: boolean;
  showAfterSeconds?: number;
}

interface SmartPromptsManagerProps {
  className?: string;
  maxVisible?: number;
}

const SmartPromptsManager: React.FC<SmartPromptsManagerProps> = ({
  className = '',
  maxVisible = 2
}) => {
  const { activeAccount } = useAccountStore();
  const { capabilities, loading } = useDataCapabilities(activeAccount?.id || null);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [visiblePrompts, setVisiblePrompts] = useState<SmartPrompt[]>([]);

  // Define all possible prompts
  const allPrompts: SmartPrompt[] = [
    {
      id: 'welcome-onboarding',
      type: 'onboarding',
      priority: 100,
      title: 'Welcome to Trading Analytics!',
      description: 'Let\'s set up your analytics for maximum insights',
      icon: <Sparkles className="w-5 h-5" />,
      action: 'Get Started',
      condition: (cap) => cap && cap.totalTrades < 3,
      dismissible: true,
      showAfterSeconds: 2
    },
    {
      id: 'import-nt8-data',
      type: 'import',
      priority: 90,
      title: 'Unlock Advanced Analytics',
      description: 'Import your NT8 data for MAE/MFE analysis and more',
      icon: <Upload className="w-5 h-5" />,
      action: 'Import Data',
      condition: (cap) => cap && cap.capabilityScore < 60 && cap.totalTrades >= 5,
      dismissible: true
    },
    {
      id: 'enable-mae-mfe',
      type: 'upgrade',
      priority: 80,
      title: 'Track Entry/Exit Timing',
      description: 'Enable MAE/MFE tracking for better trade analysis',
      icon: <Zap className="w-5 h-5" />,
      action: 'Enable Tracking',
      condition: (cap) => cap && cap.totalTrades >= 3 &&
        !cap.availableMetrics.advanced.some((m: string) => m.includes('MAE')),
      dismissible: true
    },
    {
      id: 'achievement-milestone',
      type: 'achievement',
      priority: 70,
      title: 'Achievement Unlocked!',
      description: 'You\'ve reached a new analytics milestone',
      icon: <Trophy className="w-5 h-5" />,
      action: 'View Achievements',
      condition: (cap) => cap && cap.capabilityScore >= 50 && cap.capabilityScore < 80,
      dismissible: true
    },
    {
      id: 'optimization-tip',
      type: 'tip',
      priority: 60,
      title: 'Improve Your Win Rate',
      description: 'Based on your data, here are some optimization tips',
      icon: <Target className="w-5 h-5" />,
      action: 'See Tips',
      condition: (cap) => cap && cap.totalTrades >= 10 && cap.capabilityScore >= 60,
      dismissible: true
    },
    {
      id: 'strategy-analysis',
      type: 'upgrade',
      priority: 50,
      title: 'Strategy Performance Analysis',
      description: 'Compare your trading strategies for better results',
      icon: <BarChart3 className="w-5 h-5" />,
      action: 'Analyze Strategies',
      condition: (cap) => cap && cap.totalTrades >= 15 &&
        !cap.availableMetrics.advanced.some((m: string) => m.includes('Strategy')),
      dismissible: true
    }
  ];

  // Filter and sort prompts based on conditions and priority
  useEffect(() => {
    if (!capabilities) return;

    const validPrompts = allPrompts
      .filter(prompt =>
        prompt.condition(capabilities) &&
        !dismissedPrompts.has(prompt.id)
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxVisible);

    setVisiblePrompts(validPrompts);
  }, [capabilities, dismissedPrompts, maxVisible]);

  const handlePromptAction = (prompt: SmartPrompt) => {
    switch (prompt.type) {
      case 'onboarding':
        setActiveModal('onboarding');
        break;
      case 'import':
        setActiveModal('import');
        break;
      case 'upgrade':
        setActiveModal('upgrade');
        break;
      case 'achievement':
        setShowAchievements(true);
        break;
      case 'tip':
        // Could open tips modal or navigate to tips page
        break;
    }
  };

  const handleDismissPrompt = (promptId: string) => {
    setDismissedPrompts(prev => new Set([...prev, promptId]));
  };

  const getPromptStyle = (type: SmartPrompt['type']) => {
    switch (type) {
      case 'onboarding':
        return 'border-l-4 border-l-blue-500 bg-blue-50';
      case 'import':
        return 'border-l-4 border-l-green-500 bg-green-50';
      case 'upgrade':
        return 'border-l-4 border-l-purple-500 bg-purple-50';
      case 'achievement':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'tip':
        return 'border-l-4 border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-50';
    }
  };

  const getPromptBadgeColor = (type: SmartPrompt['type']) => {
    switch (type) {
      case 'onboarding': return 'bg-blue-100 text-blue-700';
      case 'import': return 'bg-green-100 text-green-700';
      case 'upgrade': return 'bg-purple-100 text-purple-700';
      case 'achievement': return 'bg-yellow-100 text-yellow-700';
      case 'tip': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading || !capabilities || visiblePrompts.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <AnimatePresence>
          {visiblePrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { delay: index * 0.1 }
              }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
            >
              <Card className={`transition-all duration-300 hover:shadow-md ${getPromptStyle(prompt.type)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {prompt.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                          <Badge className={getPromptBadgeColor(prompt.type)}>
                            {prompt.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{prompt.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handlePromptAction(prompt)}
                        className="flex items-center space-x-1"
                      >
                        <span>{prompt.action}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>

                      {prompt.dismissible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissPrompt(prompt.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'onboarding' && (
          <AdaptiveOnboarding
            onClose={() => setActiveModal(null)}
            onStepComplete={(stepId) => {
              // Could track completion in analytics
            }}
          />
        )}

        {activeModal === 'import' && (
          <GuidedNT8Import
            onClose={() => setActiveModal(null)}
            onComplete={(file) => {
              setActiveModal(null);
              // Handle file import
            }}
          />
        )}

        {activeModal === 'upgrade' && (
          <DataUpgradeComparison
            upgradeType="enable_tracking"
            onClose={() => setActiveModal(null)}
            onStartUpgrade={() => {
              setActiveModal(null);
              // Navigate to upgrade flow
            }}
          />
        )}

        {showAchievements && (
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
              className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Achievements</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAchievements(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <DataQualityAchievements />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartPromptsManager;