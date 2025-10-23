'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getMatchScoreTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';

interface MatchScoreTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
}

/**
 * Isolated tooltip component for match score explanation
 * Uses existing tooltip infrastructure without modification
 * Completely separate from bumper and other tooltip systems
 */
export const MatchScoreTooltip: React.FC<MatchScoreTooltipProps> = ({
  className = '',
  onGuidedRankingClick
}) => {
  const tooltipContent = (
    <div className="break-words">
      <p>{getMatchScoreTooltipContent()}</p>
      {onGuidedRankingClick && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-700" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGuidedRankingClick();
            }}
            className="mt-2 text-blue-300 hover:text-blue-200 underline text-xs block"
          >
            Open Guided Rankings →
          </button>
        </>
      )}
    </div>
  );

  return (
    <MobileTooltip 
      content={tooltipContent}
      side="top"
      align="center"
      className="max-w-xs text-sm"
    >
      <div className={`inline-flex items-center cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-gray-100 transition-colors ${className}`}>
        <span className="text-gray-500">N/A</span>
        <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
      </div>
    </MobileTooltip>
  );
};
