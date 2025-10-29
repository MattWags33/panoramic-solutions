'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getNotYetRankedTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';

interface NotYetRankedTooltipProps {
  className?: string;
  onGuidedRankingClick?: () => void;
  onNavigateToCriteria?: () => void;
  inline?: boolean;
  wrapYourTool?: boolean; // When true, includes "Your Tool" text in the tooltip trigger area
  isVisible?: boolean; // Whether the tool is currently visible (for styling)
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
  onNavigateToCriteria,
  inline = false,
  wrapYourTool = false,
  isVisible = false
}) => {
  const { isTouchDevice } = useUnifiedMobileDetection();
  
  const tooltipContent = (
    <div className="break-words">
      <p>{getNotYetRankedTooltipContent()}</p>
      {(onGuidedRankingClick || onNavigateToCriteria) && (
        <>
          <div className="mt-2 pt-2 border-t border-gray-700" />
          
          {/* Mobile: Show both Guided Rankings and Criteria Sliders links */}
          {isTouchDevice ? (
            <div className="mt-2 space-y-2">
              {onGuidedRankingClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGuidedRankingClick();
                  }}
                  className="text-blue-300 hover:text-blue-200 underline text-sm block w-full text-left p-0"
                >
                  Open Guided Rankings →
                </button>
              )}
              {onNavigateToCriteria && (
                <a
                  href="#criteria-section"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // If callback provided (mobile multi-tab), use it to navigate
                    if (onNavigateToCriteria) {
                      onNavigateToCriteria();
                    } else {
                      // Otherwise, try to scroll to criteria section (single page/desktop)
                      const criteriaSection = document.getElementById('criteria-section');
                      if (criteriaSection) {
                        criteriaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className="text-blue-300 hover:text-blue-200 underline text-sm block w-full text-left"
                >
                  Adjust Criteria Sliders →
                </a>
              )}
            </div>
          ) : (
            // Desktop: Only show Guided Rankings link if available
            onGuidedRankingClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onGuidedRankingClick();
                }}
                className="mt-2 text-blue-300 hover:text-blue-200 underline text-sm block w-full text-left p-0"
              >
                Open Guided Rankings →
              </button>
            )
          )}
        </>
      )}
    </div>
  );

  // Inline compact mode for display after "Your Tool"
  if (inline) {
    return (
      <MobileTooltip 
        content={tooltipContent}
        side="bottom"
        align="center"
        className="max-w-xs text-sm"
      >
        <span className={`inline-flex items-center gap-1 ${wrapYourTool ? 'text-sm font-semibold' : 'ml-2'} ${
          wrapYourTool ? (isVisible ? 'text-green-800' : 'text-gray-600') : ''
        } ${className}`}>
          {wrapYourTool && <span>Your Tool</span>}
          <span className="text-gray-500 text-xs">Not Yet Ranked</span>
          <button 
            type="button"
            className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center -m-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
            aria-label="Not Yet Ranked Information"
          >
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </button>
        </span>
      </MobileTooltip>
    );
  }

  // Default standalone mode
  return (
    <MobileTooltip 
      content={tooltipContent}
      side="bottom"
      align="center"
      className="max-w-xs text-sm"
    >
      <button 
        type="button"
        className={`inline-flex items-center cursor-pointer px-2 py-1 -mx-2 -my-1 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation min-h-[44px] ${className}`}
        aria-label="Not Yet Ranked Information"
      >
        <span className="text-gray-500">Not Yet Ranked</span>
        <HelpCircle className="w-4 h-4 ml-1 text-gray-400" />
      </button>
    </MobileTooltip>
  );
};
