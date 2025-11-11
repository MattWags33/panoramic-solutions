-- ============================================================================
-- ADD IMPRESSION ACTION TYPE TO USER TOOL ACTIONS
-- ============================================================================
-- Purpose: Allow tracking tool impressions (when tools are displayed to users)
-- Issue: Current constraint only allows: click, view_details, compare, try_free
-- Fix: Add 'impression' to allowed action types
-- ============================================================================

BEGIN;

-- Drop existing constraint
ALTER TABLE analytics.user_tool_actions 
DROP CONSTRAINT IF EXISTS user_tool_actions_action_type_check;

-- Add new constraint with 'impression' included
ALTER TABLE analytics.user_tool_actions 
ADD CONSTRAINT user_tool_actions_action_type_check 
CHECK (action_type IN ('click', 'view_details', 'compare', 'try_free', 'impression'));

-- Update column comment
COMMENT ON COLUMN analytics.user_tool_actions.action_type IS 
'Type of action: click, view_details, compare, try_free, impression (when tool is displayed)';

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'analytics.user_tool_actions'::regclass
  AND conname = 'user_tool_actions_action_type_check';

-- Test insert with 'impression' action type (should succeed)
-- Uncomment to test:
-- INSERT INTO analytics.user_tool_actions (user_id, tool_id, tool_name, action_type, created_at)
-- SELECT user_id, 'test_tool', 'Test Tool', 'impression', NOW()
-- FROM analytics.users LIMIT 1;

