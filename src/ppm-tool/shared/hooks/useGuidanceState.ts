/**
 * Business Logic Layer - Guidance State Management
 * 
 * Pure business logic for determining WHEN to show guidance.
 * No UI concerns, no environment detection - just user-centric logic.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface GuidanceState {
  // User Progress Tracking
  interactionCount: number;
  hasCompletedOnboarding: boolean;
  lastInteractionTime: number;
  
  // User Intent Detection
  isUserStuck: boolean;
  showsHelpSeeking: boolean;
  
  // Guidance Visibility
  activeGuidance: string | null;
  guidanceHistory: string[];
  
  // User Preferences
  prefersMinimalGuidance: boolean;
  hasDisabledGuidance: boolean;
}

export interface GuidanceActions {
  // User Progress
  recordInteraction: (type: string) => void;
  markOnboardingComplete: () => void;
  
  // Intent Detection
  detectUserStuck: () => void;
  recordHelpSeeking: () => void;
  
  // Guidance Control
  showGuidance: (guidanceId: string, trigger: 'user-action' | 'user-intent' | 'user-progress') => void;
  hideGuidance: (guidanceId: string) => void;
  
  // User Preferences
  setGuidancePreference: (minimal: boolean) => void;
  disableGuidance: () => void;
}

const INTERACTION_THRESHOLD = 3;
const STUCK_TIME_THRESHOLD = 30000; // 30 seconds
const STORAGE_KEY = 'ppm-guidance-state';

/**
 * Core business logic hook for guidance state management
 */
export function useGuidanceState(): [GuidanceState, GuidanceActions] {
  // Load initial state from storage
  const getInitialState = (): GuidanceState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          interactionCount: parsed.interactionCount ?? 0,
          hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
          lastInteractionTime: parsed.lastInteractionTime ?? Date.now(),
          isUserStuck: false, // Always reset on load
          showsHelpSeeking: false, // Always reset on load
          activeGuidance: null, // Always reset on load
          guidanceHistory: parsed.guidanceHistory ?? [],
          prefersMinimalGuidance: parsed.prefersMinimalGuidance ?? false,
          hasDisabledGuidance: parsed.hasDisabledGuidance ?? false,
        };
      }
    } catch (error) {
      console.warn('Error loading guidance state:', error);
    }
    
    return {
      interactionCount: 0,
      hasCompletedOnboarding: false,
      lastInteractionTime: Date.now(),
      isUserStuck: false,
      showsHelpSeeking: false,
      activeGuidance: null,
      guidanceHistory: [],
      prefersMinimalGuidance: false,
      hasDisabledGuidance: false,
    };
  };

  const [state, setState] = useState<GuidanceState>(getInitialState);
  const stuckTimerRef = useRef<NodeJS.Timeout>();

  // Persist state changes
  const persistState = useCallback((newState: GuidanceState) => {
    try {
      const toStore = {
        interactionCount: newState.interactionCount,
        hasCompletedOnboarding: newState.hasCompletedOnboarding,
        lastInteractionTime: newState.lastInteractionTime,
        guidanceHistory: newState.guidanceHistory,
        prefersMinimalGuidance: newState.prefersMinimalGuidance,
        hasDisabledGuidance: newState.hasDisabledGuidance,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Error persisting guidance state:', error);
    }
  }, []);

  // Actions
  const actions: GuidanceActions = {
    recordInteraction: useCallback((type: string) => {
      setState(prev => {
        const newState = {
          ...prev,
          interactionCount: prev.interactionCount + 1,
          lastInteractionTime: Date.now(),
          isUserStuck: false, // Reset stuck state on interaction
        };
        persistState(newState);
        return newState;
      });
    }, [persistState]),

    markOnboardingComplete: useCallback(() => {
      setState(prev => {
        const newState = {
          ...prev,
          hasCompletedOnboarding: true,
        };
        persistState(newState);
        return newState;
      });
    }, [persistState]),

    detectUserStuck: useCallback(() => {
      // Clear existing timer
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }

      // Set new timer
      stuckTimerRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isUserStuck: true,
        }));
      }, STUCK_TIME_THRESHOLD);
    }, []),

    recordHelpSeeking: useCallback(() => {
      setState(prev => ({
        ...prev,
        showsHelpSeeking: true,
      }));
    }, []),

    showGuidance: useCallback((guidanceId: string, trigger: 'user-action' | 'user-intent' | 'user-progress') => {
      setState(prev => {
        // Don't show if guidance is disabled
        if (prev.hasDisabledGuidance) return prev;
        
        // Don't show if user prefers minimal and this isn't critical
        if (prev.prefersMinimalGuidance && trigger !== 'user-intent') return prev;
        
        // Don't show if already shown recently
        if (prev.guidanceHistory.includes(guidanceId)) return prev;

        return {
          ...prev,
          activeGuidance: guidanceId,
          guidanceHistory: [...prev.guidanceHistory, guidanceId],
        };
      });
    }, []),

    hideGuidance: useCallback((guidanceId: string) => {
      setState(prev => ({
        ...prev,
        activeGuidance: prev.activeGuidance === guidanceId ? null : prev.activeGuidance,
      }));
    }, []),

    setGuidancePreference: useCallback((minimal: boolean) => {
      setState(prev => {
        const newState = {
          ...prev,
          prefersMinimalGuidance: minimal,
        };
        persistState(newState);
        return newState;
      });
    }, [persistState]),

    disableGuidance: useCallback(() => {
      setState(prev => {
        const newState = {
          ...prev,
          hasDisabledGuidance: true,
          activeGuidance: null,
        };
        persistState(newState);
        return newState;
      });
    }, [persistState]),
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
      }
    };
  }, []);

  return [state, actions];
}

/**
 * Derived state selectors for common guidance decisions
 */
export function useGuidanceSelectors(state: GuidanceState) {
  return {
    shouldShowOnboarding: !state.hasCompletedOnboarding && state.interactionCount < INTERACTION_THRESHOLD,
    shouldShowProgressGuidance: state.interactionCount >= INTERACTION_THRESHOLD && !state.hasCompletedOnboarding,
    shouldShowHelpGuidance: state.isUserStuck || state.showsHelpSeeking,
    canShowGuidance: !state.hasDisabledGuidance,
    shouldUseMinimalGuidance: state.prefersMinimalGuidance,
  };
}
