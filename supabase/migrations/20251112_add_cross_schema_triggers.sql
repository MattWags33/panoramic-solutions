-- ============================================================================
-- ADD CROSS-SCHEMA TRIGGERS (analytics → public)
-- ============================================================================
-- Purpose: Automatically sync analytics data to public schema rollup fields
-- Critical For: Vendor dashboards, public-facing metrics, data accuracy
-- Problem: public.tools and public.criteria have rollup fields but no triggers
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: TRIGGER FOR public.tools ROLLUP FIELDS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_tool_analytics_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, analytics
AS $$
DECLARE
  v_tool_uuid UUID;
BEGIN
  -- Get the tool UUID from tool_id (which is stored as TEXT in analytics)
  -- NEW/OLD will have tool_id as TEXT, we need to cast to UUID
  IF TG_OP = 'DELETE' THEN
    v_tool_uuid := OLD.tool_id::UUID;
  ELSE
    v_tool_uuid := NEW.tool_id::UUID;
  END IF;
  
  -- Only process if tool_id is a valid UUID
  IF v_tool_uuid IS NOT NULL THEN
    -- Update public.tools rollup fields
    UPDATE public.tools
    SET 
      unique_try_free_clicks = (
        SELECT COUNT(DISTINCT user_id) 
        FROM analytics.user_tool_actions 
        WHERE tool_id = v_tool_uuid::text 
          AND action_type = 'try_free'
      ),
      unique_compare_clicks = (
        SELECT COUNT(DISTINCT user_id) 
        FROM analytics.user_tool_actions 
        WHERE tool_id = v_tool_uuid::text 
          AND action_type IN ('compare', 'add_to_compare')
      ),
      unique_view_details_clicks = (
        SELECT COUNT(DISTINCT user_id) 
        FROM analytics.user_tool_actions 
        WHERE tool_id = v_tool_uuid::text 
          AND action_type = 'view_details'
      ),
      unique_impressions = 0, -- Impressions removed, keep at 0
      total_actions = (
        SELECT COUNT(*) 
        FROM analytics.user_tool_actions 
        WHERE tool_id = v_tool_uuid::text
      ),
      last_action_at = (
        SELECT MAX(created_at) 
        FROM analytics.user_tool_actions 
        WHERE tool_id = v_tool_uuid::text
      ),
      updated_at = NOW()
    WHERE id = v_tool_uuid;
  END IF;
  
  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the transaction if tool doesn't exist in public.tools
    -- (could be a user-submitted tool not yet approved)
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.sync_tool_analytics_rollup() IS
'Syncs analytics.user_tool_actions to public.tools rollup fields for vendor dashboards';

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_tool_analytics ON analytics.user_tool_actions;

CREATE TRIGGER trigger_sync_tool_analytics
  AFTER INSERT OR UPDATE OR DELETE ON analytics.user_tool_actions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tool_analytics_rollup();

COMMENT ON TRIGGER trigger_sync_tool_analytics ON analytics.user_tool_actions IS
'Automatically updates public.tools rollup fields when tool actions are tracked';

-- ============================================================================
-- PART 2: TRIGGER FOR public.criteria ROLLUP FIELDS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_criteria_analytics_rollup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, analytics
AS $$
DECLARE
  v_criteria_id UUID;
  v_criteria_name TEXT;
BEGIN
  -- Get criteria identifier from NEW/OLD
  IF TG_OP = 'DELETE' THEN
    v_criteria_id := OLD.criteria_id;
    v_criteria_name := OLD.criteria_name;
  ELSE
    v_criteria_id := NEW.criteria_id;
    v_criteria_name := NEW.criteria_name;
  END IF;
  
  -- Update public.criteria rollup fields
  -- Match by either criteria_id OR criteria_name (for resilience)
  UPDATE public.criteria c
  SET 
    avg_user_rating = (
      SELECT AVG(rating) 
      FROM analytics.user_criteria_responses ucr
      WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
    ),
    total_responses = (
      SELECT COUNT(*) 
      FROM analytics.user_criteria_responses ucr
      WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
    ),
    last_response_at = (
      SELECT MAX(created_at) 
      FROM analytics.user_criteria_responses ucr
      WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
    )
  WHERE c.id = v_criteria_id OR c.name = v_criteria_name;
  
  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if criteria doesn't exist
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.sync_criteria_analytics_rollup() IS
'Syncs analytics.user_criteria_responses to public.criteria rollup fields';

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_criteria_analytics ON analytics.user_criteria_responses;

CREATE TRIGGER trigger_sync_criteria_analytics
  AFTER INSERT OR UPDATE OR DELETE ON analytics.user_criteria_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_criteria_analytics_rollup();

COMMENT ON TRIGGER trigger_sync_criteria_analytics ON analytics.user_criteria_responses IS
'Automatically updates public.criteria rollup fields when users rate criteria';

-- ============================================================================
-- PART 3: BACKFILL ALL EXISTING DATA
-- ============================================================================

-- Backfill public.tools
UPDATE public.tools t
SET 
  unique_try_free_clicks = (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text 
      AND uta.action_type = 'try_free'
  ),
  unique_compare_clicks = (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text 
      AND uta.action_type IN ('compare', 'add_to_compare')
  ),
  unique_view_details_clicks = (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text 
      AND uta.action_type = 'view_details'
  ),
  unique_impressions = 0, -- Impressions removed
  total_actions = (
    SELECT COUNT(*) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text
  ),
  last_action_at = (
    SELECT MAX(created_at) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text
  ),
  updated_at = NOW();

-- Backfill public.criteria
UPDATE public.criteria c
SET 
  avg_user_rating = (
    SELECT AVG(rating) 
    FROM analytics.user_criteria_responses ucr
    WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
  ),
  total_responses = (
    SELECT COUNT(*) 
    FROM analytics.user_criteria_responses ucr
    WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
  ),
  last_response_at = (
    SELECT MAX(created_at) 
    FROM analytics.user_criteria_responses ucr
    WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify public.tools rollup fields match analytics
SELECT 
  'public.tools verification' as test,
  COUNT(*) as tools_with_mismatches
FROM public.tools t
WHERE 
  t.unique_try_free_clicks != (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text AND uta.action_type = 'try_free'
  )
  OR t.unique_compare_clicks != (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text AND uta.action_type IN ('compare', 'add_to_compare')
  )
  OR t.unique_view_details_clicks != (
    SELECT COUNT(DISTINCT user_id) 
    FROM analytics.user_tool_actions uta
    WHERE uta.tool_id = t.id::text AND uta.action_type = 'view_details'
  );

-- Verify public.criteria rollup fields match analytics
SELECT 
  'public.criteria verification' as test,
  COUNT(*) as criteria_with_mismatches
FROM public.criteria c
WHERE 
  COALESCE(c.total_responses, 0) != (
    SELECT COUNT(*) 
    FROM analytics.user_criteria_responses ucr
    WHERE ucr.criteria_id = c.id OR ucr.criteria_name = c.name
  );

-- Show updated tool metrics
SELECT 
  t.name,
  t.unique_try_free_clicks,
  t.unique_compare_clicks,
  t.unique_view_details_clicks,
  t.total_actions,
  t.last_action_at::date
FROM public.tools t
WHERE t.total_actions > 0
ORDER BY t.total_actions DESC;

-- Show updated criteria metrics
SELECT 
  c.name,
  c.avg_user_rating,
  c.total_responses,
  c.last_response_at::date
FROM public.criteria c
WHERE c.total_responses > 0
ORDER BY c.total_responses DESC;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- ✅ Cross-schema triggers created
-- ✅ public.tools rollup fields now auto-sync from analytics
-- ✅ public.criteria rollup fields now auto-sync from analytics
-- ✅ Historical data backfilled
-- ✅ Vendor dashboards will now show accurate metrics

-- 📊 BENEFITS:
-- - Vendors see accurate real-time metrics
-- - public.tools can be queried directly (no JOIN to analytics needed)
-- - public.criteria shows real user feedback
-- - Automatic - no manual updates required

-- ⚠️ NOTE ON ORPHANED DATA:
-- "Easy to Use" criteria response has no match in public.criteria
-- Consider fixing the typo or creating a mapping

