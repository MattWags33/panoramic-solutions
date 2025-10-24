'use client';

/**
 * Utility to track if user has completed any guided ranking
 * This is separate from criteria adjustment checks
 */

const GUIDED_RANKING_COMPLETED_KEY = 'hasCompletedGuidedRanking';

/**
 * Check if user has completed any guided ranking (full or criteria-specific)
 * @returns true if user has completed at least one guided ranking session
 */
export function hasCompletedAnyGuidedRanking(): boolean {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return false;
    }
    return localStorage.getItem(GUIDED_RANKING_COMPLETED_KEY) === 'true';
  } catch (error) {
    console.warn('Error checking guided ranking completion status:', error);
    return false;
  }
}

/**
 * Mark that user has completed a guided ranking session
 * This should be called when user finishes any guided ranking (full or criteria-specific)
 */
export function markGuidedRankingAsCompleted(): void {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return;
    }
    localStorage.setItem(GUIDED_RANKING_COMPLETED_KEY, 'true');
    console.log('✅ Marked guided ranking as completed - match scores will now display');
  } catch (error) {
    console.error('Error marking guided ranking as completed:', error);
  }
}

/**
 * Reset the guided ranking completion status (for testing/debugging)
 */
export function resetGuidedRankingCompletion(): void {
  try {
    if (typeof window === 'undefined' || typeof Storage === 'undefined') {
      return;
    }
    localStorage.removeItem(GUIDED_RANKING_COMPLETED_KEY);
    console.log('🔄 Reset guided ranking completion status');
  } catch (error) {
    console.error('Error resetting guided ranking completion:', error);
  }
}

