-- ============================================================================
-- ANALYTICS SCHEMA - Relational Design for User Behavior Tracking
-- ============================================================================
-- Purpose: Replace monolithic visitor_sessions with normalized relational schema
-- Design: Junction tables + rollup views for flexible, queryable analytics
-- Best Practices: Following Supabase docs for junction tables, foreign keys, indexes
-- ============================================================================

BEGIN;

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table (replaces visitor_sessions)
-- Stores individual user sessions with basic metrics and rollup fields
CREATE TABLE IF NOT EXISTS analytics.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  
  -- User Identity (optional)
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  
  -- Session metadata
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  
  -- Attribution
  initial_utm_source TEXT,
  initial_utm_medium TEXT,
  initial_utm_campaign TEXT,
  
  -- Funnel stage booleans
  has_converted BOOLEAN DEFAULT FALSE,
  has_partial_ranking BOOLEAN DEFAULT FALSE,
  has_full_ranking BOOLEAN DEFAULT FALSE,
  has_manual_ranking BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for RLS and queries (Supabase best practice)
CREATE INDEX IF NOT EXISTS idx_users_session_id ON analytics.users (session_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON analytics.users (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_utm_source ON analytics.users (initial_utm_source) WHERE initial_utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON analytics.users (created_at);

COMMENT ON TABLE analytics.users IS 'Core user sessions table with funnel stage tracking and attribution';

-- ============================================================================
-- REFERENCE TABLES (for dynamic questions/criteria)
-- ============================================================================

-- Questions Table
-- Supports changing questions over time without losing historical data
CREATE TABLE IF NOT EXISTS analytics.questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('scale', 'multiple_choice', 'text', 'multi_select')),
  is_active BOOLEAN DEFAULT TRUE,
  affects_criteria JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_order ON analytics.questions (question_order) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_questions_active ON analytics.questions (is_active);

COMMENT ON TABLE analytics.questions IS 'Dynamic questions for guided ranking - supports historical analysis';

-- Question Choices Table
-- Answer options that can change without affecting historical responses
CREATE TABLE IF NOT EXISTS analytics.question_choices (
  choice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES analytics.questions(question_id) ON DELETE CASCADE,
  choice_text TEXT NOT NULL,
  choice_value INTEGER,
  choice_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint
  UNIQUE(question_id, choice_order)
);

CREATE INDEX IF NOT EXISTS idx_question_choices_question_id ON analytics.question_choices (question_id);
CREATE INDEX IF NOT EXISTS idx_question_choices_active ON analytics.question_choices (is_active);

COMMENT ON TABLE analytics.question_choices IS 'Answer options for questions - maintains referential integrity';

-- ============================================================================
-- JUNCTION TABLES (Many-to-Many Relationships)
-- ============================================================================
-- Best Practice: Composite primary keys required for PostgREST many-to-many detection
-- Source: Supabase docs on junction tables
-- ============================================================================

-- User Question Responses Junction Table
-- Links users to their question responses
CREATE TABLE IF NOT EXISTS analytics.user_question_responses (
  response_id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES analytics.questions(question_id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  
  -- Response data
  choice_id UUID REFERENCES analytics.question_choices(choice_id) ON DELETE SET NULL,
  choice_value INTEGER,
  choice_text TEXT,
  response_text TEXT,
  
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- COMPOSITE PRIMARY KEY (required for PostgREST many-to-many detection)
  -- Source: Supabase docs - books_authors example
  PRIMARY KEY (user_id, question_id, answered_at),
  
  -- Allow multiple responses to same question over time (for A/B testing)
  -- but prevent duplicate responses at same timestamp
  UNIQUE(user_id, question_id, answered_at)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_question_responses_user_id ON analytics.user_question_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_responses_question_id ON analytics.user_question_responses (question_id);
CREATE INDEX IF NOT EXISTS idx_user_question_responses_answered_at ON analytics.user_question_responses (answered_at);
CREATE INDEX IF NOT EXISTS idx_user_question_responses_question_order ON analytics.user_question_responses (question_order);

COMMENT ON TABLE analytics.user_question_responses IS 'Junction table: Users <-> Questions - supports historical analysis and A/B testing';

-- User Criteria Responses Junction Table
-- Links users to their criteria ratings (1-5 scale)
CREATE TABLE IF NOT EXISTS analytics.user_criteria_responses (
  response_id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  criteria_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  is_manual BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- COMPOSITE PRIMARY KEY
  PRIMARY KEY (user_id, criteria_name, created_at),
  
  -- Most recent rating per user per criteria (for current state)
  UNIQUE(user_id, criteria_name, created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_criteria_responses_user_id ON analytics.user_criteria_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_criteria_responses_criteria_name ON analytics.user_criteria_responses (criteria_name);
CREATE INDEX IF NOT EXISTS idx_user_criteria_responses_created_at ON analytics.user_criteria_responses (created_at);

COMMENT ON TABLE analytics.user_criteria_responses IS 'Junction table: Users <-> Criteria - tracks slider ratings over time';

-- User Tool Actions Junction Table
-- Links users to their tool interactions (click, view, compare, try_free)
CREATE TABLE IF NOT EXISTS analytics.user_tool_actions (
  action_id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  tool_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('click', 'view_details', 'compare', 'try_free')),
  
  -- Context at time of action
  position INTEGER,
  match_score NUMERIC(5,2),
  context JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- COMPOSITE PRIMARY KEY
  PRIMARY KEY (user_id, tool_id, action_type, created_at),
  
  -- Allow multiple actions of different types on same tool
  UNIQUE(user_id, tool_id, action_type, created_at)
);

-- Indexes for queries and JOIN operations (Supabase best practice)
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_user_id ON analytics.user_tool_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_tool_id ON analytics.user_tool_actions (tool_id);
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_action_type ON analytics.user_tool_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_created_at ON analytics.user_tool_actions (created_at);
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_match_score ON analytics.user_tool_actions (match_score) WHERE match_score IS NOT NULL;

-- Covering index for common query patterns (Supabase best practice: use INCLUDE for small columns)
CREATE INDEX IF NOT EXISTS idx_user_tool_actions_covering 
  ON analytics.user_tool_actions (action_type, tool_id) 
  INCLUDE (match_score, position);

COMMENT ON TABLE analytics.user_tool_actions IS 'Junction table: Users <-> Tools - tracks all tool interactions for monetization';

-- ============================================================================
-- RECOMMENDATIONS TABLE (Conversion Event)
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics.recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  
  -- User info at conversion
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Recommendation data
  recommended_tools JSONB NOT NULL DEFAULT '[]',
  match_scores JSONB NOT NULL DEFAULT '[]',
  criteria_weights JSONB NOT NULL DEFAULT '{}',
  
  -- Personalization data
  departments TEXT[],
  methodologies TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON analytics.recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_email ON analytics.recommendations (email);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON analytics.recommendations (created_at);

COMMENT ON TABLE analytics.recommendations IS 'Email report conversions - primary conversion event';

-- ============================================================================
-- ROLLUP VIEWS (Aggregated Metrics)
-- ============================================================================

-- Tool Action Rollups
-- Aggregates tool interaction metrics for dashboards and vendor reporting
CREATE OR REPLACE VIEW analytics.tool_action_rollups AS
SELECT 
  tool_id,
  tool_name,
  
  -- Click metrics
  COUNT(DISTINCT CASE WHEN action_type = 'click' THEN user_id END) as unique_clicks,
  COUNT(CASE WHEN action_type = 'click' THEN 1 END) as total_clicks,
  
  -- View details metrics
  COUNT(DISTINCT CASE WHEN action_type = 'view_details' THEN user_id END) as unique_detail_views,
  COUNT(CASE WHEN action_type = 'view_details' THEN 1 END) as total_detail_views,
  
  -- Compare metrics
  COUNT(DISTINCT CASE WHEN action_type = 'compare' THEN user_id END) as unique_comparisons,
  COUNT(CASE WHEN action_type = 'compare' THEN 1 END) as total_comparisons,
  
  -- Try free metrics (MONETIZATION KEY)
  COUNT(DISTINCT CASE WHEN action_type = 'try_free' THEN user_id END) as unique_try_free,
  COUNT(CASE WHEN action_type = 'try_free' THEN 1 END) as total_try_free,
  
  -- Context metrics
  AVG(match_score) as avg_match_score,
  AVG(position) as avg_position,
  MIN(position) as best_position,
  MAX(created_at) as last_action_at
  
FROM analytics.user_tool_actions
GROUP BY tool_id, tool_name;

COMMENT ON VIEW analytics.tool_action_rollups IS 'Aggregated tool metrics for dashboards and vendor reporting';

-- Question Response Rollups
-- Aggregates question response counts and patterns
CREATE OR REPLACE VIEW analytics.question_response_rollups AS
SELECT 
  q.question_id,
  q.question_text,
  q.question_order,
  q.question_type,
  
  COUNT(DISTINCT r.user_id) as unique_respondents,
  COUNT(*) as total_responses,
  
  -- Response rate (of all users who started guided ranking)
  ROUND(
    100.0 * COUNT(DISTINCT r.user_id) / NULLIF(
      (SELECT COUNT(DISTINCT user_id) FROM analytics.user_question_responses), 
      0
    ), 
    2
  ) as response_rate_percentage,
  
  MAX(r.answered_at) as last_response_at
  
FROM analytics.questions q
LEFT JOIN analytics.user_question_responses r ON q.question_id = r.question_id
WHERE q.is_active = TRUE
GROUP BY q.question_id, q.question_text, q.question_order, q.question_type
ORDER BY q.question_order;

COMMENT ON VIEW analytics.question_response_rollups IS 'Question response summaries for optimization';

-- User Activity Rollups
-- Aggregates per-user activity metrics
CREATE OR REPLACE VIEW analytics.user_activity_rollups AS
SELECT 
  u.user_id,
  u.session_id,
  u.email,
  u.has_converted,
  u.initial_utm_source,
  u.created_at,
  
  -- Question responses
  COUNT(DISTINCT qr.question_id) as questions_answered,
  
  -- Criteria responses
  COUNT(DISTINCT cr.criteria_name) as criteria_rated,
  
  -- Tool actions
  COUNT(DISTINCT ta.tool_id) as tools_interacted_with,
  COUNT(ta.action_id) as total_tool_actions,
  COUNT(CASE WHEN ta.action_type = 'try_free' THEN 1 END) as try_free_clicks,
  
  -- Conversion
  CASE WHEN r.recommendation_id IS NOT NULL THEN TRUE ELSE FALSE END as sent_report
  
FROM analytics.users u
LEFT JOIN analytics.user_question_responses qr ON u.user_id = qr.user_id
LEFT JOIN analytics.user_criteria_responses cr ON u.user_id = cr.user_id
LEFT JOIN analytics.user_tool_actions ta ON u.user_id = ta.user_id
LEFT JOIN analytics.recommendations r ON u.user_id = r.user_id
GROUP BY u.user_id, u.session_id, u.email, u.has_converted, u.initial_utm_source, u.created_at, r.recommendation_id;

COMMENT ON VIEW analytics.user_activity_rollups IS 'Per-user activity summary for segmentation and analysis';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================================
-- Uncomment if you want to enable RLS on analytics tables
-- Note: RLS adds overhead, only enable if you need multi-tenant analytics

-- ALTER TABLE analytics.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.question_choices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.user_question_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.user_criteria_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.user_tool_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics.recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CONSTRAINTS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION analytics.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON analytics.users
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON analytics.questions
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

CREATE TRIGGER update_question_choices_updated_at BEFORE UPDATE ON analytics.question_choices
  FOR EACH ROW EXECUTE FUNCTION analytics.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant permissions to authenticated users (via service role in RPC functions)
-- Adjust as needed for your security model

GRANT USAGE ON SCHEMA analytics TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO anon;

-- Grant SELECT on views
GRANT SELECT ON analytics.tool_action_rollups TO authenticated, anon, service_role;
GRANT SELECT ON analytics.question_response_rollups TO authenticated, anon, service_role;
GRANT SELECT ON analytics.user_activity_rollups TO authenticated, anon, service_role;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Comment out in production)
-- ============================================================================

-- Verify tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'analytics'
ORDER BY table_name;

-- Verify indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'analytics'
ORDER BY tablename, indexname;

-- Verify foreign keys
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'analytics'
ORDER BY tc.table_name, kcu.column_name;

