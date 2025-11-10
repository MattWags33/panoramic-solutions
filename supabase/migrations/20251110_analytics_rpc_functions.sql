-- ============================================================================
-- ANALYTICS RPC FUNCTIONS
-- ============================================================================
-- Purpose: Backend functions for analytics tracking from frontend
-- Called by: src/lib/analytics.ts
-- Security: Run as service_role to bypass RLS, but validate inputs
-- ============================================================================

BEGIN;

-- ============================================================================
-- FUNCTION: ensure_analytics_user
-- ============================================================================
-- Purpose: Initialize or update a user record
-- Called: On page load, email capture
-- Returns: user_id (UUID)

CREATE OR REPLACE FUNCTION analytics.ensure_analytics_user(
  p_session_id TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer_url TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run as function owner to bypass RLS
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validate session_id
  IF p_session_id IS NULL OR p_session_id = '' THEN
    RAISE EXCEPTION 'session_id is required';
  END IF;
  
  -- Insert or update user record
  INSERT INTO analytics.users (
    session_id,
    ip_address,
    user_agent,
    referrer_url,
    initial_utm_source,
    initial_utm_medium,
    initial_utm_campaign,
    email,
    first_name,
    last_name,
    first_seen_at,
    last_seen_at
  ) VALUES (
    p_session_id,
    p_ip_address::INET,
    p_user_agent,
    p_referrer_url,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_email,
    p_first_name,
    p_last_name,
    NOW(),
    NOW()
  )
  ON CONFLICT (session_id) 
  DO UPDATE SET
    last_seen_at = NOW(),
    email = COALESCE(EXCLUDED.email, analytics.users.email),
    first_name = COALESCE(EXCLUDED.first_name, analytics.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, analytics.users.last_name),
    -- Only update attribution if not already set
    initial_utm_source = COALESCE(analytics.users.initial_utm_source, EXCLUDED.initial_utm_source),
    initial_utm_medium = COALESCE(analytics.users.initial_utm_medium, EXCLUDED.initial_utm_medium),
    initial_utm_campaign = COALESCE(analytics.users.initial_utm_campaign, EXCLUDED.initial_utm_campaign)
  RETURNING user_id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION analytics.ensure_analytics_user IS 'Initialize or update user session - called on page load';

-- ============================================================================
-- FUNCTION: track_question_response
-- ============================================================================
-- Purpose: Record a guided ranking answer
-- Called: Each time user answers a question
-- Returns: response_id (UUID)

CREATE OR REPLACE FUNCTION analytics.track_question_response(
  p_session_id TEXT,
  p_question_order INTEGER,
  p_choice_value TEXT DEFAULT NULL,
  p_response_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
  v_question_id UUID;
  v_choice_id UUID;
  v_response_id UUID;
  v_choice_text TEXT;
BEGIN
  -- Get user_id from session_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;
  
  -- Get question_id from question_order
  SELECT question_id INTO v_question_id
  FROM analytics.questions
  WHERE question_order = p_question_order
    AND is_active = TRUE
  LIMIT 1;
  
  IF v_question_id IS NULL THEN
    -- Question doesn't exist yet, create placeholder
    INSERT INTO analytics.questions (
      question_text,
      question_order,
      question_type,
      is_active
    ) VALUES (
      'Question ' || p_question_order,
      p_question_order,
      'multiple_choice',
      TRUE
    )
    RETURNING question_id INTO v_question_id;
  END IF;
  
  -- Get choice_id and choice_text if choice_value provided
  IF p_choice_value IS NOT NULL THEN
    SELECT choice_id, choice_text INTO v_choice_id, v_choice_text
    FROM analytics.question_choices
    WHERE question_id = v_question_id
      AND (choice_value::TEXT = p_choice_value OR choice_text = p_choice_value)
      AND is_active = TRUE
    LIMIT 1;
    
    -- If choice doesn't exist, create it
    IF v_choice_id IS NULL THEN
      INSERT INTO analytics.question_choices (
        question_id,
        choice_text,
        choice_value,
        choice_order,
        is_active
      ) VALUES (
        v_question_id,
        p_choice_value,
        NULL, -- value stored as text in choice_value column
        999, -- placeholder order
        TRUE
      )
      RETURNING choice_id, choice_text INTO v_choice_id, v_choice_text;
    END IF;
  END IF;
  
  -- Insert response (allow duplicates for multi-select questions)
  INSERT INTO analytics.user_question_responses (
    user_id,
    question_id,
    question_order,
    choice_id,
    choice_value,
    choice_text,
    response_text,
    answered_at
  ) VALUES (
    v_user_id,
    v_question_id,
    p_question_order,
    v_choice_id,
    p_choice_value::INTEGER,
    v_choice_text,
    p_response_text,
    NOW()
  )
  ON CONFLICT (user_id, question_id, answered_at)
  DO UPDATE SET
    choice_id = EXCLUDED.choice_id,
    choice_value = EXCLUDED.choice_value,
    choice_text = EXCLUDED.choice_text,
    response_text = EXCLUDED.response_text
  RETURNING response_id INTO v_response_id;
  
  -- Update user funnel stage
  UPDATE analytics.users
  SET has_partial_ranking = TRUE,
      updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RETURN v_response_id;
END;
$$;

COMMENT ON FUNCTION analytics.track_question_response IS 'Record guided ranking answer with dynamic question/choice creation';

-- ============================================================================
-- FUNCTION: track_criteria_response
-- ============================================================================
-- Purpose: Record criteria slider rating
-- Called: When user adjusts a criteria slider
-- Returns: response_id (UUID)

CREATE OR REPLACE FUNCTION analytics.track_criteria_response(
  p_session_id TEXT,
  p_criteria_name TEXT,
  p_rating INTEGER,
  p_is_manual BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
  v_response_id UUID;
BEGIN
  -- Validate rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5, got: %', p_rating;
  END IF;
  
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;
  
  -- Insert criteria response (allow history)
  INSERT INTO analytics.user_criteria_responses (
    user_id,
    criteria_name,
    rating,
    is_manual,
    created_at
  ) VALUES (
    v_user_id,
    p_criteria_name,
    p_rating,
    p_is_manual,
    NOW()
  )
  ON CONFLICT (user_id, criteria_name, created_at)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    is_manual = EXCLUDED.is_manual
  RETURNING response_id INTO v_response_id;
  
  -- Update user funnel stage if manual
  IF p_is_manual THEN
    UPDATE analytics.users
    SET has_manual_ranking = TRUE,
        updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;
  
  RETURN v_response_id;
END;
$$;

COMMENT ON FUNCTION analytics.track_criteria_response IS 'Record criteria slider rating (1-5 scale)';

-- ============================================================================
-- FUNCTION: track_tool_action
-- ============================================================================
-- Purpose: Record tool interaction (click, view, compare, try_free)
-- Called: When user interacts with a tool card
-- Returns: action_id (UUID)

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
BEGIN
  -- Validate action_type
  IF p_action_type NOT IN ('click', 'view_details', 'compare', 'try_free') THEN
    RAISE EXCEPTION 'Invalid action_type: %. Must be one of: click, view_details, compare, try_free', p_action_type;
  END IF;
  
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;
  
  -- Generate tool_id from tool_name (normalize)
  v_tool_id := LOWER(REPLACE(p_tool_name, ' ', '_'));
  
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

COMMENT ON FUNCTION analytics.track_tool_action IS 'Record tool interaction - critical for monetization tracking';

-- ============================================================================
-- FUNCTION: track_recommendation_sent
-- ============================================================================
-- Purpose: Record email report conversion (primary conversion event)
-- Called: When user successfully sends email report
-- Returns: recommendation_id (UUID)

CREATE OR REPLACE FUNCTION analytics.track_recommendation_sent(
  p_session_id TEXT,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_recommended_tools JSONB DEFAULT '[]',
  p_match_scores JSONB DEFAULT '[]',
  p_criteria_weights JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_user_id UUID;
  v_recommendation_id UUID;
  v_departments TEXT[];
  v_methodologies TEXT[];
BEGIN
  -- Validate email
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for session_id: %', p_session_id;
  END IF;
  
  -- Extract departments from question responses (question_order 11)
  SELECT ARRAY_AGG(DISTINCT choice_text) INTO v_departments
  FROM analytics.user_question_responses
  WHERE user_id = v_user_id
    AND question_order = 11
    AND choice_text IS NOT NULL;
  
  -- Extract methodologies from question responses (question_order 12)
  SELECT ARRAY_AGG(DISTINCT choice_text) INTO v_methodologies
  FROM analytics.user_question_responses
  WHERE user_id = v_user_id
    AND question_order = 12
    AND choice_text IS NOT NULL;
  
  -- Insert recommendation
  INSERT INTO analytics.recommendations (
    user_id,
    email,
    first_name,
    last_name,
    recommended_tools,
    match_scores,
    criteria_weights,
    departments,
    methodologies,
    created_at
  ) VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_recommended_tools,
    p_match_scores,
    p_criteria_weights,
    v_departments,
    v_methodologies,
    NOW()
  )
  RETURNING recommendation_id INTO v_recommendation_id;
  
  -- Update user record
  UPDATE analytics.users
  SET 
    has_converted = TRUE,
    email = p_email,
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RETURN v_recommendation_id;
END;
$$;

COMMENT ON FUNCTION analytics.track_recommendation_sent IS 'Record email report conversion - primary conversion event';

-- ============================================================================
-- FUNCTION: get_user_analytics
-- ============================================================================
-- Purpose: Retrieve complete user analytics data
-- Called: For debugging, export, email pre-fill
-- Returns: JSONB with all user data

CREATE OR REPLACE FUNCTION analytics.get_user_analytics(
  p_session_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = analytics, public
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM analytics.users
  WHERE session_id = p_session_id;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build complete analytics object
  SELECT jsonb_build_object(
    'user', row_to_json(u.*),
    'question_responses', COALESCE(
      (SELECT jsonb_agg(row_to_json(qr.*) ORDER BY qr.answered_at)
       FROM analytics.user_question_responses qr
       WHERE qr.user_id = v_user_id),
      '[]'::jsonb
    ),
    'criteria_responses', COALESCE(
      (SELECT jsonb_agg(row_to_json(cr.*) ORDER BY cr.created_at DESC)
       FROM analytics.user_criteria_responses cr
       WHERE cr.user_id = v_user_id),
      '[]'::jsonb
    ),
    'tool_actions', COALESCE(
      (SELECT jsonb_agg(row_to_json(ta.*) ORDER BY ta.created_at DESC)
       FROM analytics.user_tool_actions ta
       WHERE ta.user_id = v_user_id),
      '[]'::jsonb
    ),
    'recommendations', COALESCE(
      (SELECT jsonb_agg(row_to_json(r.*) ORDER BY r.created_at DESC)
       FROM analytics.recommendations r
       WHERE r.user_id = v_user_id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM analytics.users u
  WHERE u.user_id = v_user_id;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION analytics.get_user_analytics IS 'Retrieve complete user analytics data for export/debugging';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant EXECUTE on RPC functions to authenticated and anon users
GRANT EXECUTE ON FUNCTION analytics.ensure_analytics_user TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION analytics.track_question_response TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION analytics.track_criteria_response TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION analytics.track_tool_action TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION analytics.track_recommendation_sent TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION analytics.get_user_analytics TO authenticated, anon, service_role;

COMMIT;

-- ============================================================================
-- VERIFICATION (Comment out in production)
-- ============================================================================

-- List all functions in analytics schema
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'analytics'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

