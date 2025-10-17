import type { Criterion } from '../types';

/**
 * Isolated utility for detecting criteria adjustment state
 * This utility is completely separate from bumper and tooltip systems
 * to ensure no interference with critical functionality
 */

/**
 * Check if any criteria have been adjusted from their default value of 3
 * @param criteria - Array of criteria to check
 * @returns true if any criterion has userRating !== 3
 */
export function hasCriteriaBeenAdjusted(criteria: Criterion[]): boolean {
  return criteria.some(criterion => criterion.userRating !== 3);
}

/**
 * Get the appropriate message for the report based on criteria adjustment state
 * @param toolCount - Number of tools being analyzed
 * @param hasAdjusted - Whether criteria have been adjusted from defaults
 * @returns Appropriate message string
 */
export function getCriteriaAdjustmentMessage(toolCount: number, hasAdjusted: boolean): string {
  if (hasAdjusted) {
    return `📊 Your report will include analysis of ${toolCount} ${toolCount === 1 ? 'tool' : 'tools'} based on your current rankings and filters.`;
  }
  return "⚠️ For best results, complete the guided rankings or adjust the Criteria sliders to match your priorities.";
}

/**
 * Get styling classes for the criteria adjustment message
 * @param hasAdjusted - Whether criteria have been adjusted from defaults
 * @returns CSS classes for styling
 */
export function getCriteriaAdjustmentMessageStyles(hasAdjusted: boolean): string {
  if (hasAdjusted) {
    return "text-xs md:text-sm text-blue-700 font-medium";
  }
  return "text-xs md:text-sm text-red-700 font-medium";
}

/**
 * Get the tooltip content for match score explanation
 * @returns Tooltip content string
 */
export function getMatchScoreTooltipContent(): string {
  return "How to get your match score 👉 complete the guided rankings or adjust the Criteria sliders to match your priorities.";
}
