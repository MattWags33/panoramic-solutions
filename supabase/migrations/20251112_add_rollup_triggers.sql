-- ============================================================================
-- ADD ROLLUP TRIGGERS FOR ANALYTICS PERFORMANCE
-- ============================================================================
-- Purpose: Automatically maintain rollup fields in analytics.users for fast queries
-- Critical For: Vendor dashboards, user segmentation, performance
-- Issue: Rollup fields exist but are never updated (all showing 0)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: CREATE TRIGGER FUNCTION TO UPDATE USER ROLLUP FIELDS
-- ============================================================================

CREATE OR REPLACE FUNCTION analytics.sync_user_action_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Determine which user_id to update (handles INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;
  
  -- Update all action counts for this user in one query (efficient)
  UPDATE analytics.users
  SET 
    compare_count = (
      SELECT COUNT(*) 
      FROM analytics.user_tool_actions 
      WHERE user_id = v_user_id 
        AND action_type IN ('compare', 'add_to_compare')
    ),
    try_free_count = (
      SELECT COUNT(*) 
      FROM analytics.user_tool_actions 
      WHERE user_id = v_user_id 
        AND action_type = 'try_free'
    ),
    view_details_count = (
      SELECT COUNT(*) 
      FROM analytics.user_tool_actions 
      WHERE user_id = v_user_id 
        AND action_type = 'view_details'
    ),
    -- Build completed_actions string
    completed_actions = (
      SELECT STRING_AGG(DISTINCT action_type, ', ' ORDER BY action_type)
      FROM analytics.user_tool_actions 
      WHERE user_id = v_user_id
    ),
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  -- Return appropriate row based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION analytics.sync_user_action_counts() IS 
'Trigger function to maintain user action count rollup fields for fast dashboard queries';

-- ============================================================================
-- PART 2: CREATE TRIGGER ON user_tool_actions
-- ============================================================================

-- Drop trigger if it exists (for migration re-run safety)
DROP TRIGGER IF EXISTS trigger_sync_user_action_counts ON analytics.user_tool_actions;

-- Create trigger for INSERT, UPDATE, DELETE
CREATE TRIGGER trigger_sync_user_action_counts
  AFTER INSERT OR UPDATE OR DELETE ON analytics.user_tool_actions
  FOR EACH ROW
  EXECUTE FUNCTION analytics.sync_user_action_counts();

COMMENT ON TRIGGER trigger_sync_user_action_counts ON analytics.user_tool_actions IS
'Automatically updates rollup fields in analytics.users when actions are tracked';

-- ============================================================================
-- PART 3: BACKFILL EXISTING DATA (ONE-TIME)
-- ============================================================================

-- Update all existing users with current counts
UPDATE analytics.users u
SET 
  compare_count = (
    SELECT COUNT(*) 
    FROM analytics.user_tool_actions uta 
    WHERE uta.user_id = u.user_id 
      AND uta.action_type IN ('compare', 'add_to_compare')
  ),
  try_free_count = (
    SELECT COUNT(*) 
    FROM analytics.user_tool_actions uta 
    WHERE uta.user_id = u.user_id 
      AND uta.action_type = 'try_free'
  ),
  view_details_count = (
    SELECT COUNT(*) 
    FROM analytics.user_tool_actions uta 
    WHERE uta.user_id = u.user_id 
      AND uta.action_type = 'view_details'
  ),
  completed_actions = (
    SELECT STRING_AGG(DISTINCT action_type, ', ' ORDER BY action_type)
    FROM analytics.user_tool_actions uta
    WHERE uta.user_id = u.user_id
  ),
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify rollup fields match actual counts
DO $$
DECLARE
  v_mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_mismatch_count
  FROM analytics.users u
  WHERE 
    u.compare_count != (
      SELECT COUNT(*) FROM analytics.user_tool_actions uta 
      WHERE uta.user_id = u.user_id AND uta.action_type IN ('compare', 'add_to_compare')
    )
    OR u.try_free_count != (
      SELECT COUNT(*) FROM analytics.user_tool_actions uta 
      WHERE uta.user_id = u.user_id AND uta.action_type = 'try_free'
    )
    OR u.view_details_count != (
      SELECT COUNT(*) FROM analytics.user_tool_actions uta 
      WHERE uta.user_id = u.user_id AND uta.action_type = 'view_details'
    );
  
  IF v_mismatch_count > 0 THEN
    RAISE EXCEPTION 'Rollup verification failed: % users have mismatched counts', v_mismatch_count;
  END IF;
  
  RAISE NOTICE 'SUCCESS: All rollup fields match actual counts';
END $$;

-- Show sample of updated users
SELECT 
  user_id,
  email,
  compare_count,
  try_free_count,
  view_details_count,
  completed_actions
FROM analytics.users
WHERE compare_count > 0 OR try_free_count > 0 OR view_details_count > 0
ORDER BY (compare_count + try_free_count + view_details_count) DESC
LIMIT 10;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- ✅ Trigger created: Automatically maintains rollup fields
-- ✅ Backfill complete: All existing users have accurate counts
-- ✅ Performance improved: Dashboard queries no longer need JOINs
-- ✅ Vendor reports: Can quickly query "users who tried our tool"

-- 📊 BENEFITS FOR VENDORS:
-- - Fast queries: SELECT * FROM users WHERE try_free_count > 0 AND tool = 'Smartsheet'
-- - User segmentation: Find high-engagement users
-- - Conversion funnels: Track users through stages
-- - Dashboard performance: No expensive JOINs needed


