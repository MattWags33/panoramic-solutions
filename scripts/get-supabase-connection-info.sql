-- Get Supabase Connection Information for PostHog Data Warehouse Integration
-- Run this in Supabase SQL Editor to get all the info you need

-- 1. Verify analytics schema exists
SELECT 
  schema_name,
  schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'analytics';

-- 2. List all analytics tables that should be synced to PostHog
SELECT 
  table_schema,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'analytics'
ORDER BY table_name;

-- 3. Verify incremental sync columns exist (updated_at, created_at, answered_at)
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'analytics'
  AND column_name IN ('updated_at', 'created_at', 'answered_at', 'user_id', 'session_id')
ORDER BY table_name, column_name;

-- 4. Check current row counts (to verify sync is working after setup)
SELECT 
  'users' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_record,
  MAX(updated_at) as newest_record
FROM analytics.users
UNION ALL
SELECT 
  'user_question_responses',
  COUNT(*),
  MIN(answered_at),
  MAX(answered_at)
FROM analytics.user_question_responses
UNION ALL
SELECT 
  'user_criteria_responses',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM analytics.user_criteria_responses
UNION ALL
SELECT 
  'user_tool_actions',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM analytics.user_tool_actions
UNION ALL
SELECT 
  'recommendations',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM analytics.recommendations;

-- 5. Sample data to verify structure (first row from each table)
SELECT 'users' as table_name, user_id, session_id, initial_utm_source, has_converted, created_at 
FROM analytics.users 
LIMIT 1;

SELECT 'user_tool_actions' as table_name, user_id, tool_id, tool_name, action_type, match_score, created_at 
FROM analytics.user_tool_actions 
LIMIT 1;

-- 6. Connection details for PostHog Data Warehouse setup
-- Copy these values to PostHog:

/*
=== PostHog Data Warehouse Connection Details ===

Host: db.ikqxrzhtdymkjmgxejxu.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Get from Supabase Dashboard → Settings → Database]
Schema: analytics
SSL Mode: require

=== Tables to Sync ===

Incremental Sync Tables (use these sync keys):
1. analytics.users → sync key: updated_at
2. analytics.user_question_responses → sync key: answered_at
3. analytics.user_criteria_responses → sync key: created_at
4. analytics.user_tool_actions → sync key: created_at
5. analytics.recommendations → sync key: created_at

Full Refresh Tables (small reference tables):
6. analytics.questions → full refresh
7. analytics.question_choices → full refresh

Recommended Sync Frequency: Every 1 hour

=== PostHog Setup URL ===
https://us.posthog.com/project/211080/pipeline/sources

=== After Setup - Test Query ===
Run this in PostHog SQL Insights to verify:

SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  MAX(updated_at) as latest_user_update
FROM analytics_users;

Expected: Should match the row count from query #4 above
*/

