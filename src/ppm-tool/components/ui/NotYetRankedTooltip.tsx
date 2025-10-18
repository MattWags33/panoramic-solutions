'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getNotYetRankedTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';

interface NotYetRankedTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
}

/**
 * Tooltip component for "Not Yet Ranked" state explanation
 * Uses existing tooltip infrastructure without modification
 * Completely separate from bumper and other tooltip systems
 */
export const NotYetRankedTooltip: React.FC<NotYetRankedTooltipProps> = ({
  className = '',
  onGuidedRankingClick
}) => {
  const tooltipContent = (
    <div>
      <p className="mb-2">{getNotYetRankedTooltipContent()}</p>
      {onGuidedRankingClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGuidedRankingClick();
          }}
          className="text-blue-300 hover:text-blue-200 underline text-xs"
        >
          Open Guided Rankings →
        </button>
      )}
    </div>
  );

  return (
    <MobileTooltip 
      content={tooltipContent}
      side="top"
      align="center"
      className="max-w-xs"
    >
      <div className={`inline-flex items-center cursor-help ${className}`}>
        <span className="text-gray-500">Not Yet Ranked</span>
        <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
      </div>
    </MobileTooltip>
  );
};
