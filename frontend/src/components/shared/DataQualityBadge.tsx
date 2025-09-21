import React from 'react';
import { Badge } from '../ui/badge';
import { DataQualityBadgeProps } from '../../types/account';
import { dataCapabilitiesService } from '../../services/dataCapabilities.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
  score,
  breakdown,
  className = ''
}) => {
  const scoreColor = dataCapabilitiesService.getCapabilityScoreColor(score);
  const scoreLabel = dataCapabilitiesService.getCapabilityScoreLabel(score);
  const percentages = dataCapabilitiesService.getDataQualityPercentages(breakdown);

  const getBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'; // Green
    if (score >= 60) return 'secondary'; // Blue
    if (score >= 40) return 'outline'; // Gray
    return 'destructive'; // Red
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '⚡';
    if (score >= 40) return '📊';
    return '📈';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={getBadgeVariant(score)}
            className={`cursor-help ${className}`}
          >
            <span className="mr-1">{getScoreIcon(score)}</span>
            {scoreLabel} ({score}%)
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">Data Quality Breakdown</div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Complete
                </span>
                <span className="font-medium">{percentages.complete}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Enhanced
                </span>
                <span className="font-medium">{percentages.enhanced}%</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Basic
                </span>
                <span className="font-medium">{percentages.basic}%</span>
              </div>
            </div>

            <div className="pt-2 border-t text-xs text-muted-foreground">
              {breakdown.basic + breakdown.enhanced + breakdown.complete} total trades
            </div>

            {score < 80 && (
              <div className="pt-2 border-t text-xs">
                <span className="text-blue-600">💡 Tip:</span> Import NT8 CSV data for advanced analytics
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DataQualityBadge;