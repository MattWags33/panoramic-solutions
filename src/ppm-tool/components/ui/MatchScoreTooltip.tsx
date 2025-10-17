'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { MobileTooltip } from './MobileTooltip';
import { getMatchScoreTooltipContent } from '@/ppm-tool/shared/utils/criteriaAdjustmentState';

interface MatchScoreTooltipProps {
  className?: string;
}

/**
 * Isolated tooltip component for match score explanation
 * Uses existing tooltip infrastructure without modification
 * Completely separate from bumper and other tooltip systems
 */
export const MatchScoreTooltip: React.FC<MatchScoreTooltipProps> = ({
  className = ''
}) => {
  const tooltipContent = getMatchScoreTooltipContent();

  return (
    <MobileTooltip 
      content={tooltipContent}
      side="top"
      align="center"
      className="max-w-xs"
    >
      <div className={`inline-flex items-center cursor-help ${className}`}>
        <span className="text-gray-500">N/A</span>
        <HelpCircle className="w-3 h-3 ml-1 text-gray-400" />
      </div>
    </MobileTooltip>
  );
};
