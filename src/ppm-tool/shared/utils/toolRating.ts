import { Tool, Criterion } from '../types';

/**
 * Unified function to get a tool's rating for a specific criterion
 * Always uses the database criteria array (tool.criteria) as the source of truth
 * @param tool - The tool object
 * @param criterionId - Either a criterion ID string or a Criterion object
 * @returns The ranking (1-5) or 0 if not found
 */
export const getToolRating = (tool: Tool, criterionId: string | Criterion): number => {
  try {
    let criterion: Criterion | null = null;
    let id: string = '';
    
    if (typeof criterionId === 'object' && criterionId !== null) {
      criterion = criterionId;
      id = criterion.id;
    } else {
      id = criterionId;
    }
    
    // First try to find in backend criteria array (source of truth)
    if (Array.isArray(tool.criteria) && tool.criteria.length > 0) {
      // First try to find by ID (most reliable)
      const criterionDataById = tool.criteria.find(c => c.id === id);
      if (criterionDataById && typeof criterionDataById.ranking === 'number') {
        return criterionDataById.ranking;
      }
      
      // Fallback: try to find by name if we have a criterion object
      const criterionName = criterion?.name;
      if (criterionName) {
        const criterionDataByName = tool.criteria.find(c => c.name === criterionName);
        if (criterionDataByName && typeof criterionDataByName.ranking === 'number') {
          return criterionDataByName.ranking;
        }
      }
    }
    
    // Fallback: check tool.ratings object (for default tools)
    if (tool.ratings && typeof tool.ratings === 'object') {
      // Try to find by criterion ID (convert to lowercase for matching)
      const ratingById = tool.ratings[id.toLowerCase()];
      if (typeof ratingById === 'number') {
        return ratingById;
      }
      
      // Try to find by criterion name (convert to lowercase for matching)
      const criterionName = criterion?.name;
      if (criterionName) {
        const ratingByName = tool.ratings[criterionName.toLowerCase()];
        if (typeof ratingByName === 'number') {
          return ratingByName;
        }
      }
    }
    
    // If not found, return 0
    return 0;
  } catch (error) {
    console.warn(`Error getting rating for criterion ${criterionId}:`, error);
    return 0;
  }
};

/**
 * Calculate the match score for a tool based on selected criteria
 * Uses the documented scoring algorithm:
 * - Base score of 8 points for meeting requirements
 * - Bonus points for exceeding requirements (max 2)
 * - Penalties for falling short (7 - shortfall * 2)
 * - Perfect score of 10 if ALL criteria are met
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns Score on 0-10 scale
 */
export const calculateScore = (tool: Tool, criteria: Criterion[]): number => {
  try {
    let totalScore = 0;
    let meetsAllCriteria = true;

    criteria.forEach((criterion) => {
      // Get tool's capability rating (1-5) from criteria_tools table
      const toolRating = getToolRating(tool, criterion);
      
      // Get user's importance ranking (1-5) from user_criteria table
      const userRating = criterion.userRating;

      // Check if tool meets minimum requirement
      if (toolRating < userRating) {
        meetsAllCriteria = false;
      }

      // Calculate individual criterion score
      if (toolRating >= userRating) {
        // Tool meets or exceeds requirement
        // Base score of 8 points + bonus for exceeding (max 2 bonus points)
        const excess = Math.min(toolRating - userRating, 2);
        totalScore += 8 + excess;
      } else {
        // Tool falls short of requirement
        // Steeper penalty for not meeting requirements
        const shortfall = userRating - toolRating;
        totalScore += Math.max(0, 7 - shortfall * 2);
      }
    });

    // Calculate average score across all criteria
    let finalScore = totalScore / criteria.length;

    // Only give perfect score if the calculated score is already very high
    // This prevents artificially inflating scores
    if (finalScore >= 9.8) {
      finalScore = 10;
    }

    return finalScore;
  } catch (error) {
    console.warn('Error calculating tool score:', error);
    return 0;
  }
};

/**
 * Legacy function - now uses the new calculateScore function
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns Score on 0-10 scale
 */
export const calculateToolScore = (tool: Tool, criteria: Criterion[]): number => {
  return calculateScore(tool, criteria);
};

/**
 * Get tool's top performing criteria (ratings >= 4)
 * @param tool - The tool object
 * @param criteria - Array of criteria to evaluate
 * @returns String of comma-separated top performing criteria names
 */
export const getTopPerformerStrengths = (tool: Tool, criteria: Criterion[]): string => {
  const strengths = criteria
    .filter(c => getToolRating(tool, c) >= 4)
    .map(c => c.name)
    .slice(0, 3);
  
  return strengths.length > 0 ? strengths.join(', ') : 'No standout strengths identified';
};

/**
 * Check if a tool meets the user's rating requirement for a criterion
 * @param tool - The tool object
 * @param criterion - The criterion object with userRating
 * @returns True if tool rating >= user rating
 */
export const toolMeetsCriterion = (tool: Tool, criterion: Criterion): boolean => {
  const toolRating = getToolRating(tool, criterion);
  return toolRating >= criterion.userRating;
};

/**
 * Get the count of criteria that a tool meets user requirements for
 * @param tool - The tool object
 * @param criteria - Array of criteria with user ratings
 * @returns Number of criteria where tool rating >= user rating
 */
export const getCriteriaMatchCount = (tool: Tool, criteria: Criterion[]): number => {
  return criteria.filter(criterion => toolMeetsCriterion(tool, criterion)).length;
};

/**
 * Test function to verify getToolRating is working correctly
 * @param tool - The tool object to test
 * @param criterionId - The criterion ID to test
 * @returns Debug information about the rating lookup
 */
export const testGetToolRating = (tool: Tool, criterionId: string) => {
  // Debug logs disabled to prevent infinite loops
  // console.log('Testing getToolRating for:', tool.name, 'criterion:', criterionId);
  // console.log('Tool criteria array:', tool.criteria);
  // console.log('Tool ratings object:', tool.ratings);
  
  const rating = getToolRating(tool, criterionId);
  // console.log('Result:', rating);
  
  return {
    toolName: tool.name,
    criterionId,
    rating,
    hasCriteriaArray: Array.isArray(tool.criteria) && tool.criteria.length > 0,
    hasRatingsObject: tool.ratings && typeof tool.ratings === 'object',
    criteriaArrayLength: Array.isArray(tool.criteria) ? tool.criteria.length : 0,
    ratingsKeys: tool.ratings ? Object.keys(tool.ratings) : []
  };
};

/**
 * Custom rounding for match scores where .1-.5 rounds down, .6-.9 rounds up
 * Examples: 9.5 → 9, 8.5 → 8, 9.6 → 10, 9.3 → 9
 * @param score - The score to round
 * @returns Rounded integer
 */
export const roundMatchScore = (score: number): number => {
  const decimal = score % 1;
  
  if (decimal >= 0.6) {
    return Math.ceil(score);
  } else {
    return Math.floor(score);
  }
}; 

/**
 * Format a 0-10 match score into a percentage label for display purposes
 * while preserving the numeric percent value for optional use.
 *
 * @param score - Raw score on 0-10 scale
 * @returns Percent representation (rounded) and preformatted label string
 */
export const formatMatchScorePercentage = (
  score: number
): { percent: number; label: string } => {
  const clampedScore = Math.max(0, Math.min(10, score));
  const percent = Math.round((clampedScore / 10) * 100);

  return {
    percent,
    label: `${percent}%`
  };
}; 