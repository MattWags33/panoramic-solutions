'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getNotYetRankedTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';

interface NotYetRankedTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
  inline?: boolean;
}

/**
 * Tooltip component for "Not Yet Ranked" state explanation
 * Uses existing tooltip infrastructure without modification
 * Completely separate from bumper and other tooltip systems
 * 
 * @param inline - When true, displays as compact inline text "(Not Yet Ranked)" for use after "Your Tool"
 */
export const NotYetRankedTooltip: React.FC<NotYetRankedTooltipProps> = ({
  className = '',
  onGuidedRankingClick,
  inline = false
}) => {
  const tooltipContent = (
    <div className="break-words">
      <p>{getNotYetRankedTooltipContent()}</p>
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

  // Inline compact mode for display after "Your Tool"
  if (inline) {
    return (
      <MobileTooltip 
        content={tooltipContent}
        side="top"
        align="center"
        className="max-w-xs text-sm"
      >
        <span className={`inline-flex items-center cursor-pointer ml-1 ${className}`}>
          <span className="text-gray-500 text-xs">(Not Yet Ranked</span>
          <HelpCircle className="w-3 h-3 ml-0.5 text-gray-400" />
          <span className="text-gray-500 text-xs">)</span>
        </span>
      </MobileTooltip>
    );
  }

  // Default standalone mode
  return (
    <MobileTooltip 
      content={tooltipContent}
      side="top"
      align="center"
      className="max-w-xs text-sm"
    >
      <div className={`inline-flex items-center cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-gray-100 transition-colors ${className}`}>
        <span className="text-gray-500">Not Yet Ranked</span>
        <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
      </div>
    </MobileTooltip>
  );
};
