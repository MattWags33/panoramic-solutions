import posthog from 'posthog-js';

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
  posthog.capture('New_Visitor', {
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    referrer: document.referrer,
    ...properties
  });
};

/**
 * Track new active user (made a single action)
 */
export const trackNewActive = (action: string, properties?: Record<string, any>) => {
  posthog.capture('New_Active', {
    action,
    timestamp: Date.now(),
    ...properties
  });
};

/**
 * Track new ranking submittal
 */
export const trackNewRankingSubmittal = (properties?: Record<string, any>) => {
  posthog.capture('New_Ranking_Submittal', {
    timestamp: Date.now(),
    ...properties
  });
};

/**
 * Track new report sent
 */
export const trackNewReportSent = (properties?: Record<string, any>) => {
  posthog.capture('New_Report_Sent', {
    timestamp: Date.now(),
    ...properties
  });
};

// State Management for Core Metrics

const STORAGE_KEYS = {
  VISITOR_TRACKED: 'posthog_visitor_tracked',
  ACTIVE_TRACKED: 'posthog_active_tracked',
  SESSION_ID: 'posthog_session_id'
};

/**
 * Check if this is a new visitor and track if so
 */
export const checkAndTrackNewVisitor = (properties?: Record<string, any>) => {
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
 */
export const checkAndTrackNewActive = (action: string, properties?: Record<string, any>) => {
  const hasTracked = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRACKED);
  
  if (!hasTracked) {
    trackNewActive(action, properties);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRACKED, 'true');
    return true;
  }
  
  return false;
};

/**
 * Generate a unique session ID
 */
export const getSessionId = (): string => {
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
  localStorage.removeItem(STORAGE_KEYS.VISITOR_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_TRACKED);
  localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
};

// Make tracking functions available globally for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).checkAndTrackNewActive = checkAndTrackNewActive;
  (window as any).checkAndTrackNewVisitor = checkAndTrackNewVisitor;
  (window as any).resetTrackingState = resetTrackingState;
  (window as any).trackNewActive = trackNewActive;
  (window as any).trackNewVisitor = trackNewVisitor;
  console.log('🔧 PostHog tracking functions available globally for debugging');
}