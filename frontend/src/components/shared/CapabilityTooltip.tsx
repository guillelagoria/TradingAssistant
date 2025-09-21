import React from 'react';
import { CapabilityTooltipProps } from '../../types/account';
import { dataCapabilitiesService } from '../../services/dataCapabilities.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Info, Upload, Zap, Target } from 'lucide-react';

const CapabilityTooltip: React.FC<CapabilityTooltipProps & { children: React.ReactNode }> = ({
  available,
  missing,
  recommendations = [],
  children
}) => {
  const primaryRecommendation = dataCapabilitiesService.getPrimaryRecommendation(recommendations);

  const getRecommendationIcon = (type: 'upgrade' | 'import' | 'complete') => {
    switch (type) {
      case 'import': return <Upload className="w-3 h-3" />;
      case 'upgrade': return <Zap className="w-3 h-3" />;
      case 'complete': return <Target className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const getRecommendationColor = (type: 'upgrade' | 'import' | 'complete') => {
    switch (type) {
      case 'import': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upgrade': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-3">
            {/* Available Metrics */}
            <div>
              <div className="font-medium mb-1 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Available Metrics
              </div>
              <div className="space-y-1">
                {available.slice(0, 4).map((metric, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {metric}
                  </div>
                ))}
                {available.length > 4 && (
                  <div className="text-xs text-muted-foreground">
                    +{available.length - 4} more...
                  </div>
                )}
              </div>
            </div>

            {/* Missing Metrics */}
            {missing.length > 0 && (
              <div>
                <div className="font-medium mb-1 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Missing Metrics
                </div>
                <div className="space-y-1">
                  {missing.slice(0, 3).map((metric, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      • {metric}
                    </div>
                  ))}
                  {missing.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{missing.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Primary Recommendation */}
            {primaryRecommendation && (
              <div className="pt-2 border-t">
                <div className="font-medium mb-2 flex items-center text-sm">
                  <Info className="w-3 h-3 mr-1" />
                  Recommendation
                </div>
                <div className={`p-2 rounded-md border ${getRecommendationColor(primaryRecommendation.type)}`}>
                  <div className="flex items-start space-x-2">
                    {getRecommendationIcon(primaryRecommendation.type)}
                    <div className="flex-1">
                      <div className="text-xs font-medium">
                        {primaryRecommendation.message}
                      </div>
                      <div className="text-xs mt-1 opacity-80">
                        {primaryRecommendation.action}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="pt-2 border-t flex justify-between items-center text-xs text-muted-foreground">
              <div>{available.length} available</div>
              {missing.length > 0 && <div>{missing.length} missing</div>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CapabilityTooltip;