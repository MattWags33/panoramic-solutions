import { useCallback } from 'react';
import { 
  posthog, 
  captureEvent, 
  trackButtonClick, 
  trackFormSubmission, 
  trackToolUsage,
  trackNewVisitor,
  trackNewActive,
  trackNewRankingSubmittal,
  trackNewReportSent,
  checkAndTrackNewVisitor,
  checkAndTrackNewActive,
  checkAndTrackNewRankingSubmittal,
  checkAndTrackNewReportSent,
  getSessionId,
  resetTrackingState
} from '@/lib/posthog';

export const usePostHog = () => {
  // Capture custom events
  const capture = useCallback((eventName: string, properties?: Record<string, any>) => {
    captureEvent(eventName, properties);
  }, []);

  // Track button clicks
  const trackClick = useCallback((buttonName: string, properties?: Record<string, any>) => {
    trackButtonClick(buttonName, properties);
  }, []);

  // Track form submissions
  const trackForm = useCallback((formName: string, properties?: Record<string, any>) => {
    trackFormSubmission(formName, properties);
  }, []);

  // Track tool usage (specific to PPM tool)
  const trackTool = useCallback((toolName: string, action: string, properties?: Record<string, any>) => {
    trackToolUsage(toolName, action, properties);
  }, []);

  // Identify user
  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    posthog.identify(userId, properties);
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: Record<string, any>) => {
    posthog.people.set(properties);
  }, []);

  // Get user ID
  const getUserId = useCallback(() => {
    return posthog.get_distinct_id();
  }, []);

  // Check if user is identified
  const isIdentified = useCallback(() => {
    return posthog.isFeatureEnabled('any_feature'); // This will return false if user is not identified
  }, []);

  // Core Metrics Tracking
  const trackVisitor = useCallback((properties?: Record<string, any>) => {
    trackNewVisitor(properties);
  }, []);

  const trackActive = useCallback((action: string, properties?: Record<string, any>) => {
    trackNewActive(action, properties);
  }, []);

  const trackRanking = useCallback((properties?: Record<string, any>) => {
    trackNewRankingSubmittal(properties);
  }, []);

  const trackReport = useCallback((properties?: Record<string, any>) => {
    trackNewReportSent(properties);
  }, []);

  // Automatic tracking utilities
  const checkAndTrackVisitor = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewVisitor(properties);
  }, []);

  const checkAndTrackActive = useCallback((action: string, properties?: Record<string, any>) => {
    return checkAndTrackNewActive(action, properties);
  }, []);

  const checkAndTrackRanking = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewRankingSubmittal(properties);
  }, []);

  const checkAndTrackReport = useCallback((properties?: Record<string, any>) => {
    return checkAndTrackNewReportSent(properties);
  }, []);

  const getSession = useCallback(() => {
    return getSessionId();
  }, []);

  const resetState = useCallback(() => {
    resetTrackingState();
  }, []);

  return {
    posthog,
    capture,
    trackClick,
    trackForm,
    trackTool,
    identify,
    setUserProperties,
    getUserId,
    isIdentified,
    // Core metrics
    trackVisitor,
    trackActive,
    trackRanking,
    trackReport,
    // Session-aware tracking utilities
    checkAndTrackVisitor,
    checkAndTrackActive,
    checkAndTrackRanking,
    checkAndTrackReport,
    getSession,
    resetState,
  };
};
