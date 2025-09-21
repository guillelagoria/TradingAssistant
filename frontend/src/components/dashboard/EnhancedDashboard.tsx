import React from 'react';
import { motion } from 'framer-motion';
import AdaptiveStatsCards from './AdaptiveStatsCards';
import SmartPromptsManager from '../prompts/SmartPromptsManager';
import { useDataCapabilities } from '../../hooks/useDataCapabilities';
import { useAccountStore } from '../../store/accountStore';
import { Separator } from '../ui/separator';

const EnhancedDashboard: React.FC = () => {
  const { activeAccount } = useAccountStore();
  const { capabilities, loading } = useDataCapabilities(activeAccount?.id || null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Smart Prompts Section - Only show if there are actionable prompts */}
      {!loading && capabilities && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">💡 Smart Insights</h2>
            <div className="text-sm text-muted-foreground">
              Personalized recommendations for your trading analytics
            </div>
          </div>

          <SmartPromptsManager maxVisible={2} />

          {/* Separator only if prompts are visible */}
          <Separator className="my-6" />
        </div>
      )}

      {/* Main Dashboard Content */}
      <AdaptiveStatsCards />
    </motion.div>
  );
};

export default EnhancedDashboard;