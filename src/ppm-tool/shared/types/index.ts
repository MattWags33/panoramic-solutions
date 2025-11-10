export interface Criterion {
  id: string;
  name: string;
  description: string;
  tooltipDescription?: string;
  userRating: number;
  ratingDescriptions: {
    low: string;
    high: string;
  };
}

export interface CriteriaRating {
  id: string;
  name: string;
  ranking: number;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  type: string;
}

export interface Tool {
  id: string;
  name: string;
  logo: string;
  useCases: string[];
  methodologies: string[];
  functions: string[];
  ratings: Record<string, number>;
  ratingExplanations: Record<string, string>;
  type: string;
  created_by: string | null;
  criteria: CriteriaRating[];
  tags: Tag[];
  created_on: string;
  updated_at?: string;
  submitted_at?: string;
  approved_at?: string;
  submission_status: string;
  removed?: boolean;
}

export interface ComparisonState {
  selectedCriteria: Criterion[];
  selectedTools: Tool[];
}

// Analytics Schema Types - New Relational Structure
export interface AnalyticsUser {
  id: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  fingerprint_hash?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_page_views: number;
  total_time_on_tool: number;
  is_active: boolean;
  has_manual_ranking: boolean;
  has_partial_ranking: boolean;
  has_full_ranking: boolean;
  has_sent_report: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionResponse {
  id: string;
  user_id: string;
  question_id: string;
  question_choice_id?: string;
  response_text?: string;
  response_timestamp: string;
  created_at: string;
}

export interface CriteriaResponse {
  id: string;
  user_id: string;
  criteria_id: string;
  rating: number;
  response_timestamp: string;
  created_at: string;
}

export type ToolActionType = 'click' | 'view_details' | 'compare' | 'try_free';

export interface ToolAction {
  id: string;
  user_id: string;
  tool_id: string;
  action_type: ToolActionType;
  position?: number;
  match_score?: number;
  context?: Record<string, any>;
  created_at: string;
}

export interface RecommendationRecord {
  id: string;
  user_id: string;
  recommended_tools: any[];
  match_scores: Record<string, any>;
  criteria_weights: Record<string, any>;
  sent_at?: string;
  email_sent_to?: string;
  created_at: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_order: number;
  question_type: 'multiple_choice' | 'scale' | 'text';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionChoice {
  id: string;
  question_id: string;
  choice_text: string;
  choice_value: string;
  choice_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAnalytics {
  user: AnalyticsUser;
  question_responses: QuestionResponse[];
  criteria_responses: CriteriaResponse[];
  tool_actions: ToolAction[];
  recommendations: RecommendationRecord[];
}

// Analytics Rollup Views Types
export interface ToolActionRollup {
  tool_id: string;
  tool_name: string;
  unique_clicks: number;
  total_clicks: number;
  unique_detail_views: number;
  total_detail_views: number;
  unique_comparisons: number;
  total_comparisons: number;
  unique_try_free: number;
  total_try_free: number;
  avg_match_score?: number;
  avg_position?: number;
}

export interface QuestionResponseRollup {
  question_id: string;
  question_text: string;
  question_order: number;
  total_responses: number;
  response_count: number;
}

export interface UserActivityRollup {
  user_id: string;
  session_id: string;
  email?: string;
  first_seen_at: string;
  last_seen_at: string;
  total_page_views: number;
  total_time_on_tool: number;
  questions_answered: number;
  criteria_rated: number;
  tools_interacted_with: number;
  total_tool_actions: number;
  action_types_taken: ToolActionType[];
  has_recommendations: boolean;
}