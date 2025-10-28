'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getMatchScoreTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

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
  const { isTouchDevice } = useUnifiedMobileDetection();
const tooltipContent = (
  <div className="break-words">
    <p>{getMatchScoreTooltipContent()}</p>
    {onGuidedRankingClick && (
      <>
        <div className="mt-2 pt-2 border-t border-gray-700" />
        
        {/* Mobile: Show Guided Rankings and Criteria Sliders links */}
        {isTouchDevice ? (
          <div className="mt-2 space-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGuidedRankingClick();
              }}
              className="text-blue-300 hover:text-blue-200 underline text-xs block w-full text-left"
            >
              Open Guided Rankings →
            </button>
            <a
              href="#criteria-section"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Scroll to criteria section
                const criteriaSection = document.getElementById('criteria-section');
                if (criteriaSection) {
                  criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="text-blue-300 hover:text-blue-200 underline text-xs block w-full text-left"
            >
              Adjust Criteria Sliders →
            </a>
          </div>
        ) : (
          // Desktop: Only show Guided Rankings link
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGuidedRankingClick();
            }}
            className="mt-2 text-blue-300 hover:text-blue-200 underline text-xs block"
          >
            Open Guided Rankings →
          </button>
        )}
      </>
    )}
  </div>
);

return (
  <div onClick={(e) => e.stopPropagation()} className="relative z-[100]">
      <MobileTooltip 
        content={tooltipContent}
        side="top"
        align="start"
        className="max-w-xs text-sm !z-[9999]"
      >
        <div 
          className={`inline-flex items-center px-2 py-1 rounded-lg bg-gray-50 min-h-[44px] md:min-h-0 cursor-pointer relative z-[100] ${className}`}
          aria-label="Match Score Information - Not yet ranked, tap to learn more"
        >
          <span className="text-gray-500 text-xs">N/A</span>
          <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
          {includeLabel && (
            <span className="text-xs ml-1 text-gray-600">Match Score</span>
          )}
        </div>
      </MobileTooltip>
    </div>
  );
};
