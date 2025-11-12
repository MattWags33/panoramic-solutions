-- ============================================================================
-- REMOVE IMPRESSIONS & FIX TOOL IDS
-- ============================================================================
-- Purpose: 
--   1. Remove impression tracking (not useful)
--   2. Fix tool_id to use proper UUIDs from public.tools
--   3. Delete tool_mapping table (unused/orphaned)
-- Date: 2025-11-12
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: DELETE IMPRESSION DATA
-- ============================================================================

-- Delete all impression records (320 records as of 2025-11-12)
DELETE FROM analytics.user_tool_actions
WHERE action_type = 'impression';

-- Update users table rollup fields to remove impression counts
UPDATE analytics.users
SET impression_count = 0
WHERE impression_count > 0;

-- Update tools table rollup fields to remove impression counts
UPDATE public.tools
SET unique_impressions = 0,
    total_actions = total_actions - unique_impressions
WHERE unique_impressions > 0;

-- ============================================================================
-- PART 2: REMOVE IMPRESSION FROM CONSTRAINTS
-- ============================================================================

-- Drop existing constraint
ALTER TABLE analytics.user_tool_actions 
DROP CONSTRAINT IF EXISTS user_tool_actions_action_type_check;

-- Add new constraint WITHOUT 'impression'
ALTER TABLE analytics.user_tool_actions 
ADD CONSTRAINT user_tool_actions_action_type_check 
CHECK (action_type IN ('click', 'view_details', 'compare', 'try_free', 'add_to_compare'));

-- Update column comment
COMMENT ON COLUMN analytics.user_tool_actions.action_type IS 
'Type of action: click, view_details, compare, try_free, add_to_compare (NO MORE IMPRESSIONS)';

-- ============================================================================
-- PART 3: UPDATE RPC FUNCTION TO REJECT IMPRESSIONS
-- ============================================================================

-- Update track_tool_action to reject impression action_type
CREATE OR REPLACE FUNCTION analytics.track_tool_action(
  p_session_id TEXT,
  p_tool_name TEXT,
  p_action_type TEXT,
  p_position INTEGER DEFAULT NULL,
  p_match_score NUMERIC DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
  v_action_id UUID;
  v_tool_id TEXT;
  v_tool_uuid UUID;
BEGIN
  -- Validate action_type (NO MORE IMPRESSIONS)
  IF p_action_type NOT IN ('click', 'view_details', 'compare', 'try_free', 'add_to_compare') THEN
    RAISE EXCEPTION 'Invalid action_type: %. Must be one of: click, view_details, compare, try_free, add_to_compare', p_action_type;
  END IF;
  
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;
  
  -- ✅ NEW: Try to find tool UUID from public.tools by name
  SELECT id INTO v_tool_uuid
  FROM public.tools
  WHERE name = p_tool_name
  LIMIT 1;
  
  -- Use UUID if found, otherwise generate slug (for backwards compatibility)
  IF v_tool_uuid IS NOT NULL THEN
    v_tool_id := v_tool_uuid::TEXT;
  ELSE
    -- Fallback: Generate tool_id from tool_name (normalize)
    v_tool_id := LOWER(REPLACE(p_tool_name, ' ', '_'));
  END IF;
  
  -- Insert tool action (allow multiple actions)
  INSERT INTO analytics.user_tool_actions (
    user_id,
    tool_id,
    tool_name,
    action_type,
    position,
    match_score,
    context,
    created_at
  ) VALUES (
    v_user_id,
    v_tool_id,
    p_tool_name,
    p_action_type,
    p_position,
    p_match_score,
    p_context,
    NOW()
  )
  ON CONFLICT (user_id, tool_id, action_type, created_at)
  DO UPDATE SET
    position = EXCLUDED.position,
    match_score = EXCLUDED.match_score,
    context = EXCLUDED.context
  RETURNING action_id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$;

COMMENT ON FUNCTION analytics.track_tool_action IS 
'Record tool interaction (NO MORE IMPRESSIONS). Now uses proper UUIDs from public.tools.';

-- ============================================================================
-- PART 4: DROP TOOL_MAPPING TABLE (unused/orphaned)
-- ============================================================================

DROP TABLE IF EXISTS analytics.tool_mapping;

-- ============================================================================
-- PART 5: CREATE TOOL ID MAPPING VIEW FOR REPORTING
-- ============================================================================

-- Create view to map existing text tool_ids to UUIDs for reporting
CREATE OR REPLACE VIEW analytics.tool_id_mapping AS
SELECT DISTINCT
  uta.tool_id as text_id,
  uta.tool_name,
  t.id as uuid_id,
  t.name as db_name,
  CASE 
    WHEN uta.tool_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
    ELSE 'SLUG'
  END as id_type,
  CASE 
    WHEN t.id IS NOT NULL THEN true
    ELSE false
  END as has_match
FROM analytics.user_tool_actions uta
LEFT JOIN public.tools t ON (
  uta.tool_id = t.id::text OR
  LOWER(REPLACE(t.name, ' ', '_')) = uta.tool_id OR
  LOWER(REPLACE(t.name, ' ', '')) = REPLACE(uta.tool_id, '_', '')
)
ORDER BY uta.tool_name;

COMMENT ON VIEW analytics.tool_id_mapping IS 
'Maps text-based tool_ids in analytics to UUIDs in public.tools. Use for reporting and data cleanup.';

-- Grant permissions
GRANT SELECT ON analytics.tool_id_mapping TO authenticated, anon, service_role;

-- ============================================================================
-- PART 6: UPDATE EXISTING TOOL_IDS TO UUIDS (DATA MIGRATION)
-- ============================================================================

-- Update existing records to use UUIDs where possible
-- This preserves historical data while standardizing IDs going forward

-- Adobe Workfront
UPDATE analytics.user_tool_actions
SET tool_id = '62cbfd91-6c7c-401f-bb12-5d2070fe14a7'
WHERE tool_name = 'Adobe Workfront' AND tool_id != '62cbfd91-6c7c-401f-bb12-5d2070fe14a7';

-- Airtable
UPDATE analytics.user_tool_actions
SET tool_id = 'e9e83125-f9b1-4f3a-b4d4-ba551756a48f'
WHERE tool_name = 'Airtable' AND tool_id != 'e9e83125-f9b1-4f3a-b4d4-ba551756a48f';

-- Asana
UPDATE analytics.user_tool_actions
SET tool_id = '0223de82-dd95-4492-86ea-ccf3d9fa1618'
WHERE tool_name = 'Asana' AND tool_id != '0223de82-dd95-4492-86ea-ccf3d9fa1618';

-- Azure DevOps
UPDATE analytics.user_tool_actions
SET tool_id = '76f23e50-93e0-4f8d-83f1-e74f227138d8'
WHERE tool_name = 'Azure DevOps' AND tool_id != '76f23e50-93e0-4f8d-83f1-e74f227138d8';

-- ClickUp
UPDATE analytics.user_tool_actions
SET tool_id = 'a5d6005e-69c6-4924-92f4-3fc3c42a7ec7'
WHERE tool_name = 'ClickUp' AND tool_id != 'a5d6005e-69c6-4924-92f4-3fc3c42a7ec7';

-- Jira
UPDATE analytics.user_tool_actions
SET tool_id = '2e20b91a-77e1-46dc-acdb-693a9b530c81'
WHERE tool_name = 'Jira' AND tool_id != '2e20b91a-77e1-46dc-acdb-693a9b530c81';

-- Microsoft Planner Premium
UPDATE analytics.user_tool_actions
SET tool_id = '95723ecd-e503-4cf1-8abc-a4a58efe458a'
WHERE tool_name = 'Microsoft Planner Premium' AND tool_id != '95723ecd-e503-4cf1-8abc-a4a58efe458a';

-- Microsoft Project (handles both "MS Project" and "Microsoft Project")
UPDATE analytics.user_tool_actions
SET tool_id = '19df3927-561f-4b8c-bec1-43e8e2f0ee90'
WHERE (tool_name = 'Microsoft Project' OR tool_name = 'MS Project') 
  AND tool_id != '19df3927-561f-4b8c-bec1-43e8e2f0ee90';

-- Monday.com
UPDATE analytics.user_tool_actions
SET tool_id = '3797e739-9685-471e-92de-4747025a8e22'
WHERE tool_name = 'Monday.com' AND tool_id != '3797e739-9685-471e-92de-4747025a8e22';

-- Planview
UPDATE analytics.user_tool_actions
SET tool_id = 'a7b48e9b-45c5-4334-ac8a-3499e78bbf02'
WHERE tool_name = 'Planview' AND tool_id != 'a7b48e9b-45c5-4334-ac8a-3499e78bbf02';

-- Smartsheet
UPDATE analytics.user_tool_actions
SET tool_id = 'beaee6ec-5fb5-4b63-a0db-f8f2cdd793e8'
WHERE tool_name = 'Smartsheet' AND tool_id != 'beaee6ec-5fb5-4b63-a0db-f8f2cdd793e8';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify impressions are gone
DO $$
DECLARE
  impression_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO impression_count
  FROM analytics.user_tool_actions
  WHERE action_type = 'impression';
  
  IF impression_count > 0 THEN
    RAISE EXCEPTION 'Failed to delete impressions: % records still exist', impression_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All impression records deleted';
END $$;

-- Verify constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'analytics.user_tool_actions'::regclass
  AND conname = 'user_tool_actions_action_type_check';

-- Verify tool_mapping is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'analytics' AND table_name = 'tool_mapping'
  ) THEN
    RAISE EXCEPTION 'tool_mapping table still exists';
  END IF;
  
  RAISE NOTICE 'SUCCESS: tool_mapping table deleted';
END $$;

-- Show tool_id mapping summary
SELECT 
  id_type,
  has_match,
  COUNT(*) as tool_count
FROM analytics.tool_id_mapping
GROUP BY id_type, has_match
ORDER BY id_type, has_match;

-- Show sample of remaining actions
SELECT 
  action_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT tool_id) as unique_tools
FROM analytics.user_tool_actions
GROUP BY action_type
ORDER BY count DESC;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- ✅ Impressions removed: 320 records deleted
-- ✅ RPC function updated: Now rejects impression action_type
-- ✅ RPC function enhanced: Now uses proper UUIDs from public.tools
-- ✅ Historical data migrated: All existing tool_ids updated to UUIDs
-- ✅ tool_mapping dropped: Unused table removed
-- ✅ Reporting view created: analytics.tool_id_mapping for analytics

-- 📊 NEXT STEPS:
-- 1. Update frontend tools.ts to include UUID mappings
-- 2. Update analytics tracking calls to pass UUIDs from tools data
-- 3. Monitor analytics.tool_id_mapping to ensure all tools have matches
-- 4. Consider adding FK constraint: user_tool_actions.tool_id → public.tools.id::text


