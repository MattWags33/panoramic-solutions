/**
 * PANORAMIC SOLUTIONS: Analytics Service
 * JSON-First, LLM-Optimized Tracking
 * 
 * All tracking is fire-and-forget with built-in error handling.
 * Tracking failures NEVER break the UI.
 */

import { supabase } from './supabase';

// Session ID management
let cachedSessionId: string | null = null;

/**
 * Get or create analytics session ID
 * Stored in localStorage for persistence across page reloads
 */
export function getAnalyticsSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  
  if (typeof window === 'undefined') {
    return 'ssr-session'; // Server-side rendering fallback
  }
  
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  
  cachedSessionId = sessionId;
  return sessionId;
}

/**
 * Get client IP address (best effort)
 */
async function getClientIP(): Promise<string | null> {
  try {
    // In production, you might have a server endpoint that returns the IP
    // For now, we'll let Supabase handle this server-side if needed
    return null;
  } catch {
    return null;
  }
}

/**
 * Analytics Service
 * All methods are async but fire-and-forget (don't await in UI code)
 */
export const analytics = {
  /**
   * Track page view
   * Call on initial app load and route changes
   * 
   * BEST PRACTICE: localStorage session_id is primary identifier (like Google Analytics)
   * IP address stored as metadata only (geolocation, fraud detection)
   * Cache clears create new sessions (~5% of users) - this is acceptable and standard
   */
  async trackPageView(options?: {
    path?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      const ip = await getClientIP();
      
      await supabase.rpc('track_page_view', {
        p_session_id: sessionId,
        p_path: options?.path || window.location.pathname,
        p_referrer: options?.referrer || document.referrer || null,
        p_ip_address: ip,
        p_user_agent: navigator.userAgent,
        p_utm_source: options?.utmSource || null,
        p_utm_medium: options?.utmMedium || null,
        p_utm_campaign: options?.utmCampaign || null,
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackPageView):', error);
      // Never throw - tracking failures don't break the app
    }
  },

  /**
   * Track criteria ranking change (slider movement)
   * Call whenever user adjusts a criteria slider
   */
  async trackCriteriaRanking(options: {
    criteriaId: string;
    criteriaName: string;
    score: number;
    isManual?: boolean;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      await supabase.rpc('track_criteria_ranking', {
        p_session_id: sessionId,
        p_criteria_id: options.criteriaId,
        p_criteria_name: options.criteriaName,
        p_score: options.score,
        p_is_manual: options.isManual ?? true,
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackCriteriaRanking):', error);
    }
  },

  /**
   * Track guided ranking answer
   * Call for each question answered in the guided ranking flow
   */
  async trackGuidedRankingAnswer(options: {
    questionId: string;
    questionText: string;
    answer: any; // Can be number, string, array, object
    affectsCriteria?: string;
    isComplete?: boolean;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      await supabase.rpc('track_guided_ranking_answer', {
        p_session_id: sessionId,
        p_question_id: options.questionId,
        p_question_text: options.questionText,
        p_answer: options.answer,
        p_affects_criteria: options.affectsCriteria || null,
        p_is_complete: options.isComplete || false,
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackGuidedRankingAnswer):', error);
    }
  },

  /**
   * Track tool click (MONETIZATION KEY)
   * Call when user clicks: Try Free, Add to Compare, View Details
   */
  async trackToolClick(options: {
    toolId: string;
    toolName: string;
    actionType: 'try_free' | 'add_to_compare' | 'view_details';
    position?: number;
    matchScore?: number;
    context?: Record<string, any>;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      await supabase.rpc('track_tool_click', {
        p_session_id: sessionId,
        p_tool_id: options.toolId,
        p_tool_name: options.toolName,
        p_action_type: options.actionType,
        p_position: options.position || null,
        p_match_score: options.matchScore || null,
        p_context: options.context || {},
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackToolClick):', error);
    }
  },

  /**
   * Track tool impression
   * Call when tool is displayed in recommendation results
   */
  async trackToolImpression(options: {
    toolId: string;
    position: number;
    matchScore: number;
    matchBreakdown?: Record<string, any>;
    competingTools?: Array<{ toolId: string; toolName: string; score: number }>;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      await supabase.rpc('track_tool_impression', {
        p_session_id: sessionId,
        p_tool_id: options.toolId,
        p_position: options.position,
        p_match_score: options.matchScore,
        p_match_breakdown: options.matchBreakdown || {},
        p_competing_tools: options.competingTools || [],
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackToolImpression):', error);
    }
  },

  /**
   * Track report sent (CONVERSION EVENT)
   * Call when user successfully sends email report
   */
  async trackReportSent(options: {
    email: string;
    firstName?: string;
    lastName?: string;
    tools: Array<{ id: string; name: string; score: number }>;
    criteria: Record<string, number>;
    matchScores?: Array<{ toolId: string; toolName: string; score: number; rank: number }>;
    firmographics?: Record<string, any>;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      await supabase.rpc('track_report_sent', {
        p_session_id: sessionId,
        p_email: options.email,
        p_first_name: options.firstName || null,
        p_last_name: options.lastName || null,
        p_tools: options.tools,
        p_criteria: options.criteria,
        p_match_scores: options.matchScores || [],
        p_firmographics: options.firmographics || {},
      });
    } catch (error) {
      console.warn('Analytics tracking failed (trackReportSent):', error);
    }
  },

  /**
   * Get complete session data (for debugging/export)
   * Returns entire session as LLM-parsable JSON
   */
  async getSessionData(sessionId?: string): Promise<any> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sid = sessionId || getAnalyticsSessionId();
      const { data, error } = await supabase.rpc('get_session_data', {
        p_session_id: sid,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to fetch session data:', error);
      return null;
    }
  },
};

/**
 * Initialize analytics on app load
 * Call this once in your root component
 */
export function initializeAnalytics() {
  // Ensure session ID is created
  getAnalyticsSessionId();
  
  // Track initial page view
  analytics.trackPageView();
  
  // Log to console (remove in production)
  console.log('📊 Analytics initialized:', {
    sessionId: getAnalyticsSessionId(),
    timestamp: new Date().toISOString(),
  });
}

