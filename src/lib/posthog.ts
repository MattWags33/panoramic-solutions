import posthog from 'posthog-js';
import { getAttribution, captureAttribution } from './attribution';

// Re-export posthog for easy access
export { posthog };

// Helper function to identify users
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  posthog.identify(userId, properties);
};

// Helper function to capture custom events
export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, properties);
};

// Helper function to set user properties
export const setUserProperties = (properties: Record<string, any>) => {
  posthog.people.set(properties);
};

// Helper function to track page views manually (if needed)
export const trackPageView = (pageName?: string) => {
  posthog.capture('$pageview', { page_name: pageName });
};

// Helper function to track custom page views
export const trackCustomPageView = (pageName: string, properties?: Record<string, any>) => {
  posthog.capture('page_view', { page_name: pageName, ...properties });
};

// Helper function to track button clicks
export const trackButtonClick = (buttonName: string, properties?: Record<string, any>) => {
  posthog.capture('button_click', { button_name: buttonName, ...properties });
};

// Helper function to track form submissions
export const trackFormSubmission = (formName: string, properties?: Record<string, any>) => {
  posthog.capture('form_submission', { form_name: formName, ...properties });
};

// Helper function to track tool usage (for PPM tool)
export const trackToolUsage = (toolName: string, action: string, properties?: Record<string, any>) => {
  posthog.capture('tool_usage', { 
    tool_name: toolName, 
    action, 
    ...properties 
  });
};

// Core Metrics Tracking Functions

/**
 * Track new visitor (first time user)
 */
export const trackNewVisitor = (properties?: Record<string, any>) => {
  // Always include attribution data
  const attribution = getAttribution() || {};
  
  posthog.capture('New_Visitor', {
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    referrer: document.referrer,
    ...attribution,
    ...properties
  });
};

/**
 * Track new active user (made a single action)
 * Special handling: If user starts on "how it works", first action doesn't count
 */
export const trackNewActive = (action: string, properties?: Record<string, any>) => {
  // Always include attribution data
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('New_Active', {
      action,
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackNewActive):', error);
  }
};

/**
 * Track new manual ranking (slider movement)
 * Fires ONCE when user first moves any slider
 */
export const trackNewManualRanking = (properties?: Record<string, any>) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('New_Manual_Ranking', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackNewManualRanking):', error);
  }
};

/**
 * Track new partial ranking (guided ranking question answered)
 * Fires ONCE when user first answers any guided ranking question
 */
export const trackNewPartialRanking = (properties?: Record<string, any>) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('New_Partial_Ranking', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackNewPartialRanking):', error);
  }
};

/**
 * Track new full ranking submittal
 * Fires ONCE when user completes entire guided ranking OR all partial rankings are complete
 */
export const trackNewFullRankingSubmittal = (properties?: Record<string, any>) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('New_Full_Ranking_Submittal', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackNewFullRankingSubmittal):', error);
  }
};

/**
 * Track new report sent
 */
export const trackNewReportSent = (properties?: Record<string, any>) => {
  // Always include attribution data
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('New_Report_Sent', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackNewReportSent):', error);
  }
};

/**
 * Track tool "Try Free" click (HIGHEST INTENT - MONETIZATION KEY)
 */
export const trackToolTryFreeClick = (properties: {
  tool_id: string;
  tool_name: string;
  position?: number;
  match_score?: number;
  criteria_rankings?: Record<string, number>;
  firmographics?: Record<string, any>;
}) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('Tool_Try_Free_Click', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackToolTryFreeClick):', error);
  }
};

/**
 * Track tool "Add to Compare" click
 */
export const trackToolAddToCompareClick = (properties: {
  tool_id: string;
  tool_name: string;
  position?: number;
  match_score?: number;
  comparing_with?: string[];
}) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('Tool_Add_To_Compare_Click', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackToolAddToCompareClick):', error);
  }
};

/**
 * Track tool "View Details" click
 */
export const trackToolViewDetailsClick = (properties: {
  tool_id: string;
  tool_name: string;
  position?: number;
  match_score?: number;
  expanded?: boolean;
}) => {
  const attribution = getAttribution() || {};
  
  try {
    posthog.capture('Tool_View_Details_Click', {
      timestamp: Date.now(),
      ...attribution,
      ...properties
    });
  } catch (error) {
    console.warn('PostHog tracking failed (trackToolViewDetailsClick):', error);
  }
};

// State Management for Core Metrics

const STORAGE_KEYS = {
  VISITOR_TRACKED: 'posthog_visitor_tracked',
  ACTIVE_TRACKED: 'posthog_active_tracked',
  MANUAL_RANKING_TRACKED: 'posthog_manual_ranking_tracked', // NEW: First slider move
  PARTIAL_RANKING_TRACKED: 'posthog_partial_ranking_tracked', // NEW: First question answered
  FULL_RANKING_TRACKED: 'posthog_full_ranking_tracked', // NEW: All questions completed
  REPORT_TRACKED: 'posthog_report_tracked',
  SESSION_ID: 'posthog_session_id',
  LANDING_PATH: 'posthog_landing_path' // NEW: Initial landing URL
};

/**
 * Check if this is a new visitor and track if so
 */
export const checkAndTrackNewVisitor = (properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.VISITOR_TRACKED);
  
  if (!hasTracked) {
    trackNewVisitor(properties);
    localStorage.setItem(STORAGE_KEYS.VISITOR_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Check if this is a new active user and track if so
 * Special handling: If user starts on "how it works" and action is closing it, don't count
 */
export const checkAndTrackNewActive = (action: string, properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRACKED);
  
  if (!hasTracked) {
    // Check if user landed on "how it works"
    const landingPath = localStorage.getItem(STORAGE_KEYS.LANDING_PATH);
    const isHowItWorksStart = landingPath?.includes('section=how-it-works');
    
    // If they started on "how it works" and this action is closing it, skip
    if (isHowItWorksStart && action === 'how_it_works_close') {
      return false; // Don't count closing modal as active
    }
    
    // Otherwise, track as active
    trackNewActive(action, properties);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Check if this is a new manual ranking and track if so
 * Fires ONCE when user first moves any slider
 */
export const checkAndTrackNewManualRanking = (properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.MANUAL_RANKING_TRACKED);
  
  if (!hasTracked) {
    trackNewManualRanking(properties);
    localStorage.setItem(STORAGE_KEYS.MANUAL_RANKING_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Check if this is a new partial ranking and track if so
 * Fires ONCE when user first answers any guided ranking question
 */
export const checkAndTrackNewPartialRanking = (properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.PARTIAL_RANKING_TRACKED);
  
  if (!hasTracked) {
    trackNewPartialRanking(properties);
    localStorage.setItem(STORAGE_KEYS.PARTIAL_RANKING_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Check if this is a new full ranking submittal and track if so
 * Fires ONCE when user completes entire guided ranking OR all partial rankings are complete
 */
export const checkAndTrackNewFullRankingSubmittal = (properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.FULL_RANKING_TRACKED);
  
  if (!hasTracked) {
    trackNewFullRankingSubmittal(properties);
    localStorage.setItem(STORAGE_KEYS.FULL_RANKING_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Check if this is a new report sent and track if so
 */
export const checkAndTrackNewReportSent = (properties?: Record<string, any>) => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return false;
  
  const hasTracked = localStorage.getItem(STORAGE_KEYS.REPORT_TRACKED);
  
  if (!hasTracked) {
    trackNewReportSent(properties);
    localStorage.setItem(STORAGE_KEYS.REPORT_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Generate a unique session ID
 */
export const getSessionId = (): string => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return `session_ssr_${Date.now()}`;
  
  let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  
  return sessionId;
};

/**
 * Reset tracking state (useful for testing or user logout)
 */
export const resetTrackingState = () => {
  // Ensure we're in the browser before accessing localStorage
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.VISITOR_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.MANUAL_RANKING_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.PARTIAL_RANKING_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.FULL_RANKING_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.REPORT_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
  localStorage.removeItem(STORAGE_KEYS.LANDING_PATH);
};

// Make tracking functions available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).posthog_debug = {
    // Check and track functions (one-time events)
    checkAndTrackNewVisitor,
    checkAndTrackNewActive,
    checkAndTrackNewManualRanking,
    checkAndTrackNewPartialRanking,
    checkAndTrackNewFullRankingSubmittal,
    checkAndTrackNewReportSent,
    
    // Direct tracking functions
    trackNewVisitor,
    trackNewActive,
    trackNewManualRanking,
    trackNewPartialRanking,
    trackNewFullRankingSubmittal,
    trackNewReportSent,
    trackToolTryFreeClick,
    trackToolAddToCompareClick,
    trackToolViewDetailsClick,
    
    // Utilities
    resetTrackingState,
    getSessionId
  };
  
  console.log('🎯 PostHog Debug: Access tracking functions via window.posthog_debug');
}