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
   * Initialize or update user session
   * Call on initial app load and route changes
   * Creates/updates analytics.users record in new relational schema
   */
  async initializeUser(options?: {
    path?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      const ip = await getClientIP();
      
      const { data: userId, error } = await supabase.rpc('ensure_analytics_user', {
        p_session_id: sessionId,
        p_ip_address: ip,
        p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        p_referrer_url: options?.referrer || (typeof document !== 'undefined' ? document.referrer : null) || null,
        p_utm_source: options?.utmSource || null,
        p_utm_medium: options?.utmMedium || null,
        p_utm_campaign: options?.utmCampaign || null,
        p_email: options?.email || null,
        p_first_name: options?.firstName || null,
        p_last_name: options?.lastName || null,
      });
      
      if (error) throw error;
      return userId;
    } catch (error) {
      console.warn('Analytics tracking failed (initializeUser):', error);
      // Never throw - tracking failures don't break the app
      return null;
    }
  },

  /**
   * Track page view (legacy compatibility)
   * Calls initializeUser for backward compatibility
   */
  async trackPageView(options?: {
    path?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    await this.initializeUser(options);
  },

  /**
   * Track criteria ranking change (slider movement)
   * Call whenever user adjusts a criteria slider
   * Stores in user_criteria_responses junction table
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
      
      const { error } = await supabase.rpc('track_criteria_response', {
        p_session_id: sessionId,
        p_criteria_name: options.criteriaName,
        p_rating: Math.round(options.score), // Ensure integer rating
      });
      
      if (error) throw error;
    } catch (error) {
      console.warn('Analytics tracking failed (trackCriteriaRanking):', error);
    }
  },

  /**
   * Track guided ranking answer
   * Call for each question answered in the guided ranking flow
   * Stores in user_question_responses junction table
   */
  async trackGuidedRankingAnswer(options: {
    questionId: string;
    questionOrder: number;
    answer: any; // Can be number, string, array, object
    questionText?: string;
    affectsCriteria?: string;
    isComplete?: boolean;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      // For multiple choice questions, we may need to track multiple responses
      if (Array.isArray(options.answer)) {
        // Track each selected option separately
        for (const value of options.answer) {
          const { error } = await supabase.rpc('track_question_response', {
            p_session_id: sessionId,
            p_question_order: options.questionOrder,
            p_choice_value: String(value),
            p_response_text: null,
          });
          if (error) throw error;
        }
      } else {
        // Single choice or text response
        const { error } = await supabase.rpc('track_question_response', {
          p_session_id: sessionId,
          p_question_order: options.questionOrder,
          p_choice_value: typeof options.answer === 'string' ? null : String(options.answer),
          p_response_text: typeof options.answer === 'string' ? options.answer : null,
        });
        if (error) throw error;
      }
    } catch (error) {
      console.warn('Analytics tracking failed (trackGuidedRankingAnswer):', error);
    }
  },

  /**
   * Track tool interaction (MONETIZATION KEY)
   * Call when user interacts with tools: Try Free, Add to Compare, View Details, Click
   * Stores in user_tool_actions junction table
   */
  async trackToolClick(options: {
    toolId: string;
    toolName: string;
    actionType: 'try_free' | 'add_to_compare' | 'view_details' | 'click';
    position?: number;
    matchScore?: number;
    context?: Record<string, any>;
  }) {
    try {
      if (!supabase) return; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      // Map action types to our schema
      const actionTypeMap = {
        'add_to_compare': 'compare',
        'try_free': 'try_free',
        'view_details': 'view_details',
        'click': 'click'
      };
      
      const { error } = await supabase.rpc('track_tool_action', {
        p_session_id: sessionId,
        p_tool_name: options.toolName,
        p_action_type: actionTypeMap[options.actionType] || 'click',
        p_position: options.position || null,
        p_match_score: options.matchScore || null,
        p_context: options.context || {},
      });
      
      if (error) throw error;
    } catch (error) {
      console.warn('Analytics tracking failed (trackToolClick):', error);
    }
  },

  /**
   * Track tool impression
   * Call when tool is displayed in recommendation results
   * Now consolidated into trackToolClick with action_type: 'impression'
   */
  async trackToolImpression(options: {
    toolId: string;
    toolName?: string;
    position: number;
    matchScore: number;
    matchBreakdown?: Record<string, any>;
    competingTools?: Array<{ toolId: string; toolName: string; score: number }>;
  }) {
    // Use the unified tool action tracking
    await this.trackToolClick({
      toolId: options.toolId,
      toolName: options.toolName || 'Unknown',
      actionType: 'click', // Impression treated as implicit click
      position: options.position,
      matchScore: options.matchScore,
      context: {
        type: 'impression',
        match_breakdown: options.matchBreakdown,
        competing_tools: options.competingTools
      }
    });
  },

  /**
   * Track report sent (CONVERSION EVENT)
   * Call when user successfully sends email report
   * Stores in analytics.recommendations table
   */
  async trackReportSent(options: {
    email: string;
    firstName?: string;
    lastName?: string;
    tools: Array<{ id: string; name: string; score: number }>;
    criteria: Record<string, number>;
    matchScores?: Array<{ toolId: string; toolName: string; score: number; rank: number }>;
    firmographics?: Record<string, any>;
  }): Promise<string | null> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sessionId = getAnalyticsSessionId();
      
      const { data: recommendationId, error } = await supabase.rpc('track_recommendation_sent', {
        p_session_id: sessionId,
        p_email: options.email,
        p_first_name: options.firstName || null,
        p_last_name: options.lastName || null,
        p_recommended_tools: options.tools,
        p_match_scores: options.matchScores || [],
        p_criteria_weights: options.criteria || {},
      });
      
      if (error) throw error;
      return recommendationId;
    } catch (error) {
      console.warn('Analytics tracking failed (trackReportSent):', error);
      return null;
    }
  },

  /**
   * Get complete user analytics data (for debugging/export)
   * Returns entire user analytics as LLM-parsable JSON from relational schema
   */
  async getSessionData(sessionId?: string): Promise<any> {
    try {
      if (!supabase) return null; // Supabase not configured
      
      const sid = sessionId || getAnalyticsSessionId();
      const { data, error } = await supabase.rpc('get_user_analytics', {
        p_session_id: sid,
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to fetch user analytics data:', error);
      return null;
    }
  },

  /**
   * Get user's question responses
   * Helper function for guided ranking form
   */
  async getUserQuestionResponses(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.question_responses || [];
    } catch (error) {
      console.warn('Failed to fetch question responses:', error);
      return [];
    }
  },

  /**
   * Get user's criteria responses  
   * Helper function for criteria sliders
   */
  async getUserCriteriaResponses(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.criteria_responses || [];
    } catch (error) {
      console.warn('Failed to fetch criteria responses:', error);
      return [];
    }
  },

  /**
   * Get user's tool actions
   * Helper function for analytics dashboards
   */
  async getUserToolActions(sessionId?: string): Promise<any[]> {
    try {
      const data = await this.getSessionData(sessionId);
      return data?.tool_actions || [];
    } catch (error) {
      console.warn('Failed to fetch tool actions:', error);
      return [];
    }
  },
};

/**
 * Initialize analytics on app load
 * Call this once in your root component
 */
export async function initializeAnalytics() {
  // Ensure session ID is created
  const sessionId = getAnalyticsSessionId();
  
  // Initialize user record in new relational schema
  await analytics.initializeUser();
  
  // Log to console (remove in production)
  console.log('📊 Analytics initialized:', {
    sessionId,
    timestamp: new Date().toISOString(),
    schema: 'relational'
  });
}

