'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getMatchScoreTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';

interface MatchScoreTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
  includeLabel?: boolean; // When true, includes "Match Score" text in the clickable area
}

/**
 * Isolated tooltip component for match score explanation
 * Uses EXACT pattern from criteria page tooltips (CriteriaSection.tsx lines 193-211)
 * This ensures consistent behavior and accessibility across mobile/desktop
 * Completely separate from bumper and other tooltip systems
 */
export const MatchScoreTooltip: React.FC<MatchScoreTooltipProps> = ({
  className = '',
  onGuidedRankingClick,
  includeLabel = false
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
      side="bottom"
      align="center"
      className="max-w-xs text-sm"
    >
      <button 
        type="button"
        className={`text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 ${className}`}
        aria-label="Match Score Information"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-gray-500">N/A</span>
        <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
        {includeLabel && (
          <span className="text-xs ml-1 text-gray-600">Match Score</span>
        )}
      </button>
    </MobileTooltip>
  );
};
