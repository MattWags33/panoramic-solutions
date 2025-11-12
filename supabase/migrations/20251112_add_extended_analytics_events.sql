-- ============================================================================
-- EXTENDED ANALYTICS EVENTS
-- ============================================================================
-- Adds new event tables and RPC functions to capture richer analytics signals:
--   * Filter interactions
--   * Guided ranking funnel events
--   * Comparison chart engagement
--   * Overlay (bumper) lifecycle events
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. User Filter Actions
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.user_filter_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  session_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'add',
    'update',
    'remove',
    'toggle_mode',
    'clear_all',
    'guided_sync'
  )),
  filter_type text,
  filter_value text,
  operator text,
  rating integer,
  filter_mode text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_filter_actions_user_created_idx
  ON analytics.user_filter_actions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION analytics.track_filter_action(
  p_session_id text,
  p_action_type text,
  p_filter_type text DEFAULT NULL,
  p_filter_value text DEFAULT NULL,
  p_operator text DEFAULT NULL,
  p_rating integer DEFAULT NULL,
  p_filter_mode text DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id uuid;
  v_action_id uuid;
BEGIN
  IF p_action_type NOT IN ('add','update','remove','toggle_mode','clear_all','guided_sync') THEN
    RAISE EXCEPTION 'Invalid filter action type: %', p_action_type;
  END IF;

  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;

  INSERT INTO analytics.user_filter_actions (
    user_id,
    session_id,
    action_type,
    filter_type,
    filter_value,
    operator,
    rating,
    filter_mode,
    context
  )
  VALUES (
    v_user_id,
    p_session_id,
    p_action_type,
    p_filter_type,
    p_filter_value,
    p_operator,
    p_rating,
    p_filter_mode,
    COALESCE(p_context, '{}'::jsonb)
  )
  RETURNING action_id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

-- --------------------------------------------------------------------------
-- 2. Guided Ranking Funnel Events
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.guided_flow_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'flow_started',
    'question_answered',
    'mode_toggled',
    'flow_completed',
    'flow_abandoned',
    'manual_rank_update',
    'step_viewed'
  )),
  question_id text,
  question_order integer,
  mode text,
  value text,
  numeric_value numeric,
  time_spent_ms integer,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guided_flow_events_user_created_idx
  ON analytics.guided_flow_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION analytics.track_guided_flow_event(
  p_session_id text,
  p_event_type text,
  p_question_id text DEFAULT NULL,
  p_question_order integer DEFAULT NULL,
  p_mode text DEFAULT NULL,
  p_value text DEFAULT NULL,
  p_numeric_value numeric DEFAULT NULL,
  p_time_spent_ms integer DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
BEGIN
  IF p_event_type NOT IN (
    'flow_started',
    'question_answered',
    'mode_toggled',
    'flow_completed',
    'flow_abandoned',
    'manual_rank_update',
    'step_viewed'
  ) THEN
    RAISE EXCEPTION 'Invalid guided flow event type: %', p_event_type;
  END IF;

  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;

  INSERT INTO analytics.guided_flow_events (
    user_id,
    session_id,
    event_type,
    question_id,
    question_order,
    mode,
    value,
    numeric_value,
    time_spent_ms,
    context
  )
  VALUES (
    v_user_id,
    p_session_id,
    p_event_type,
    p_question_id,
    p_question_order,
    p_mode,
    p_value,
    p_numeric_value,
    p_time_spent_ms,
    COALESCE(p_context, '{}'::jsonb)
  )
  RETURNING event_id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- --------------------------------------------------------------------------
-- 3. Comparison Chart Interactions
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.chart_interactions (
  interaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  session_id text NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN (
    'toggle_tool',
    'toggle_criterion',
    'show_all_tools',
    'hide_all_tools',
    'show_all_criteria',
    'hide_all_criteria'
  )),
  tool_id text,
  criterion_id text,
  action text,
  criteria_adjusted boolean,
  visible_tool_count integer,
  visible_criterion_count integer,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chart_interactions_user_created_idx
  ON analytics.chart_interactions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION analytics.track_chart_interaction(
  p_session_id text,
  p_interaction_type text,
  p_tool_id text DEFAULT NULL,
  p_criterion_id text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_criteria_adjusted boolean DEFAULT NULL,
  p_visible_tool_count integer DEFAULT NULL,
  p_visible_criterion_count integer DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id uuid;
  v_interaction_id uuid;
BEGIN
  IF p_interaction_type NOT IN (
    'toggle_tool',
    'toggle_criterion',
    'show_all_tools',
    'hide_all_tools',
    'show_all_criteria',
    'hide_all_criteria'
  ) THEN
    RAISE EXCEPTION 'Invalid chart interaction type: %', p_interaction_type;
  END IF;

  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;

  INSERT INTO analytics.chart_interactions (
    user_id,
    session_id,
    interaction_type,
    tool_id,
    criterion_id,
    action,
    criteria_adjusted,
    visible_tool_count,
    visible_criterion_count,
    context
  )
  VALUES (
    v_user_id,
    p_session_id,
    p_interaction_type,
    p_tool_id,
    p_criterion_id,
    p_action,
    p_criteria_adjusted,
    p_visible_tool_count,
    p_visible_criterion_count,
    COALESCE(p_context, '{}'::jsonb)
  )
  RETURNING interaction_id INTO v_interaction_id;

  RETURN v_interaction_id;
END;
$$;

-- --------------------------------------------------------------------------
-- 4. Overlay / Bumper Events
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS analytics.overlay_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES analytics.users(user_id) ON DELETE CASCADE,
  session_id text NOT NULL,
  overlay text NOT NULL CHECK (overlay IN (
    'product_bumper',
    'exit_intent',
    'guided_ranking',
    'manual_guidance',
    'comparison_report'
  )),
  event_type text NOT NULL CHECK (event_type IN (
    'shown',
    'cta_clicked',
    'dismissed',
    'timeout'
  )),
  trigger text,
  cta text,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS overlay_events_user_created_idx
  ON analytics.overlay_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION analytics.track_overlay_event(
  p_session_id text,
  p_overlay text,
  p_event_type text,
  p_trigger text DEFAULT NULL,
  p_cta text DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
BEGIN
  IF p_overlay NOT IN (
    'product_bumper',
    'exit_intent',
    'guided_ranking',
    'manual_guidance',
    'comparison_report'
  ) THEN
    RAISE EXCEPTION 'Invalid overlay: %', p_overlay;
  END IF;

  IF p_event_type NOT IN ('shown','cta_clicked','dismissed','timeout') THEN
    RAISE EXCEPTION 'Invalid overlay event type: %', p_event_type;
  END IF;

  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;

  INSERT INTO analytics.overlay_events (
    user_id,
    session_id,
    overlay,
    event_type,
    trigger,
    cta,
    context
  )
  VALUES (
    v_user_id,
    p_session_id,
    p_overlay,
    p_event_type,
    p_trigger,
    p_cta,
    COALESCE(p_context, '{}'::jsonb)
  )
  RETURNING event_id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMIT;

