/*
  # Fix Security and Performance Issues

  1. Security Fixes
    - Fix 7 functions with mutable search_path by adding SET search_path = public
    - Fix 2 views with SECURITY DEFINER by recreating without SECURITY DEFINER
    - Move pg_net extension from public schema to extensions schema

  2. Performance Fixes
    - Fix 3 RLS policies with auth function calls by wrapping with SELECT subquery
    - Consolidate multiple permissive policies on tools table

  3. Preserved Functionality
    - Public contact form submissions remain accessible (anon + authenticated)
    - Email reports remain accessible for tracking (public)
*/

-- ============================================================================
-- 1. FIX FUNCTIONS WITH MUTABLE SEARCH_PATH
-- ============================================================================

-- Fix generate_weekly_summary_data
CREATE OR REPLACE FUNCTION public.generate_weekly_summary_data(
  p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
  db_health JSONB;
  email_stats JSONB;
  weekly_contacts JSONB;
  result JSONB;
BEGIN
  -- Calculate date range (last 7 days if not provided)
  IF p_start_date IS NULL OR p_end_date IS NULL THEN
    end_date := NOW();
    start_date := end_date - INTERVAL '7 days';
  ELSE
    start_date := p_start_date;
    end_date := p_end_date;
  END IF;
  
  -- 1. Get Database Health
  SELECT get_database_health() INTO db_health;
  
  -- Add date range to health data
  SELECT db_health || jsonb_build_object(
    'week_start', start_date,
    'week_end', end_date
  ) INTO db_health;
  
  -- 2. Get Email Statistics
  SELECT get_weekly_email_stats(start_date, end_date) INTO email_stats;
  
  -- 3. Get Weekly Contacts (deduplicated, only new ones)
  BEGIN
    WITH unique_contacts AS (
      SELECT * FROM get_weekly_unique_contacts(start_date, end_date)
      WHERE is_new_this_week = true  -- Only include truly new contacts
    ),
    -- Further deduplicate by company (keep first contact per company)
    company_deduped_known AS (
      SELECT DISTINCT ON (company_normalized)
        email_hash,
        email,
        name,
        company,
        source,
        first_contact_date
      FROM unique_contacts
      WHERE company_normalized != 'unknown'
      ORDER BY company_normalized, first_contact_date ASC
    ),
    -- Include all unknown company contacts (usually PPM tool users)
    unknown_company_contacts AS (
      SELECT 
        email_hash,
        email,
        name,
        company,
        source,
        first_contact_date
      FROM unique_contacts
      WHERE company_normalized = 'unknown'
    ),
    -- Combine both sets
    final_contacts AS (
      SELECT * FROM company_deduped_known
      UNION ALL
      SELECT * FROM unknown_company_contacts
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'email_hash', email_hash,
        'email', email,
        'name', name,
        'company', company,
        'source', source,
        'date', first_contact_date::date
      ) ORDER BY first_contact_date DESC
    ) INTO weekly_contacts FROM final_contacts;
  EXCEPTION WHEN OTHERS THEN
    SELECT '[]'::jsonb INTO weekly_contacts;
  END;
  
  -- Build final result
  SELECT jsonb_build_object(
    'db_health', db_health,
    'email_stats', email_stats,
    'weekly_contacts', COALESCE(weekly_contacts, '[]'::jsonb),
    'date_range', jsonb_build_object(
      'start', start_date,
      'end', end_date,
      'start_date_formatted', TO_CHAR(start_date AT TIME ZONE 'America/Chicago', 'Mon DD, YYYY'),
      'end_date_formatted', TO_CHAR(end_date AT TIME ZONE 'America/Chicago', 'Mon DD, YYYY')
    ),
    'generated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Fix get_database_health
CREATE OR REPLACE FUNCTION public.get_database_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  BEGIN
    SELECT jsonb_build_object(
      'status', 'healthy',
      'total_emails', (SELECT COUNT(*) FROM email_reports),
      'total_contacts', (SELECT COUNT(*) FROM contact_submissions),
      'total_webhooks', (SELECT COUNT(*) FROM email_webhook_events),
      'last_checked', NOW()
    ) INTO result;
  EXCEPTION WHEN OTHERS THEN
    SELECT jsonb_build_object(
      'status', 'error',
      'error', SQLERRM,
      'last_checked', NOW()
    ) INTO result;
  END;
  
  RETURN result;
END;
$function$;

-- Fix get_weekly_email_stats
CREATE OR REPLACE FUNCTION public.get_weekly_email_stats(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  BEGIN
    WITH weekly_emails AS (
      SELECT * FROM email_reports 
      WHERE created_at >= p_start_date AND created_at <= p_end_date
    ),
    stats AS (
      SELECT 
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE email_status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE email_status = 'bounced') as bounced,
        COUNT(*) FILTER (WHERE email_status = 'complained') as complained,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked
      FROM weekly_emails
    )
    SELECT jsonb_build_object(
      'total_sent', total_sent,
      'delivered', delivered,
      'bounced', bounced,
      'complained', complained,
      'opened', opened,
      'clicked', clicked,
      'delivery_rate', CASE WHEN total_sent > 0 THEN ROUND((delivered::numeric / total_sent * 100), 1) ELSE 0 END,
      'open_rate', CASE WHEN delivered > 0 THEN ROUND((opened::numeric / delivered * 100), 1) ELSE 0 END,
      'click_rate', CASE WHEN delivered > 0 THEN ROUND((clicked::numeric / delivered * 100), 1) ELSE 0 END
    ) INTO result FROM stats;
  EXCEPTION WHEN OTHERS THEN
    SELECT jsonb_build_object(
      'error', SQLERRM,
      'total_sent', 0
    ) INTO result;
  END;
  
  RETURN result;
END;
$function$;

-- Fix get_weekly_unique_contacts
CREATE OR REPLACE FUNCTION public.get_weekly_unique_contacts(
  p_start_date timestamp with time zone,
  p_end_date timestamp with time zone
)
RETURNS TABLE(
  email_hash character varying,
  email character varying,
  name text,
  company text,
  company_normalized text,
  source text,
  first_contact_date timestamp with time zone,
  is_new_this_week boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  WITH 
  -- Get PPM tool contacts from email_reports
  ppm_contacts AS (
    SELECT 
      er.email_hash,
      er.user_email as email,
      COALESCE(
        CASE 
          WHEN er.first_name IS NOT NULL AND er.last_name IS NOT NULL 
          THEN er.first_name || ' ' || er.last_name
          WHEN er.first_name IS NOT NULL 
          THEN er.first_name
          ELSE 'PPM Tool User'
        END, 
        'PPM Tool User'
      ) as name,
      'Unknown Company' as company,
      'unknown' as company_normalized,
      'PPM Tool' as source,
      er.created_at as contact_date
    FROM email_reports er
    WHERE er.created_at >= p_start_date 
      AND er.created_at <= p_end_date
      AND er.email_hash IS NOT NULL
  ),
  
  -- Get contact form submissions
  form_contacts AS (
    SELECT 
      ENCODE(SHA256(LOWER(TRIM(cs.email))::bytea), 'hex') as email_hash,
      cs.email,
      cs.name,
      cs.company,
      normalize_company_name(cs.company) as company_normalized,
      'Contact Form' as source,
      cs.created_at as contact_date
    FROM contact_submissions cs
    WHERE cs.created_at >= p_start_date 
      AND cs.created_at <= p_end_date
      AND cs.email IS NOT NULL
      AND TRIM(cs.email) != ''
  ),
  
  -- Combine and deduplicate by email_hash (first touch wins)
  all_contacts AS (
    SELECT * FROM ppm_contacts
    UNION ALL
    SELECT * FROM form_contacts
  ),
  
  unique_contacts AS (
    SELECT DISTINCT ON (email_hash)
      email_hash,
      email,
      name,
      company,
      company_normalized,
      source,
      contact_date as first_contact_date
    FROM all_contacts
    ORDER BY email_hash, contact_date ASC
  ),
  
  -- Check if this contact was included in previous weekly summaries
  previous_summaries AS (
    SELECT DISTINCT jsonb_array_elements_text(contacts_included) as prev_email_hash
    FROM weekly_summary_log
    WHERE week_start_date < DATE(p_start_date)
  )
  
  -- Final selection with new contact flag
  SELECT 
    uc.email_hash,
    uc.email,
    uc.name,
    uc.company,
    uc.company_normalized,
    uc.source,
    uc.first_contact_date,
    (ps.prev_email_hash IS NULL) as is_new_this_week
  FROM unique_contacts uc
  LEFT JOIN previous_summaries ps ON uc.email_hash = ps.prev_email_hash
  ORDER BY uc.first_contact_date DESC;
END;
$function$;

-- Fix normalize_company_name
CREATE OR REPLACE FUNCTION public.normalize_company_name(company_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
BEGIN
  IF company_name IS NULL OR TRIM(company_name) = '' THEN
    RETURN 'unknown';
  END IF;
  
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(company_name), '\s+(inc|llc|corp|ltd|co|corporation|incorporated|limited)\.?\s*$', '', 'i'),
        '[^a-zA-Z0-9\s]', '', 'g'
      ),
      '\s+', '', 'g'
    )
  );
END;
$function$;

-- Fix send_weekly_summary
CREATE OR REPLACE FUNCTION public.send_weekly_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  summary_data JSONB;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
  request_id BIGINT;
  edge_function_url TEXT;
  cron_secret TEXT;
  is_enabled BOOLEAN;
BEGIN
  -- Log that the job started
  INSERT INTO cron_job_log (job_name, status, message) 
  VALUES ('weekly_summary', 'running', 'Weekly summary job started');
  
  -- Check if weekly summary is enabled
  SELECT config_value::boolean INTO is_enabled 
  FROM system_config 
  WHERE config_key = 'weekly_summary_enabled';
  
  IF NOT COALESCE(is_enabled, true) THEN
    INSERT INTO cron_job_log (job_name, status, message) 
    VALUES ('weekly_summary', 'skipped', 'Weekly summary disabled in config');
    RETURN;
  END IF;
  
  -- Calculate date range (last 7 days, ending at current time)
  end_date := NOW();
  start_date := end_date - INTERVAL '7 days';
  
  -- Generate summary data
  SELECT generate_weekly_summary_data(start_date, end_date) INTO summary_data;
  
  -- Get configuration from config table
  SELECT config_value INTO edge_function_url 
  FROM system_config 
  WHERE config_key = 'edge_function_url';
  
  SELECT config_value INTO cron_secret 
  FROM system_config 
  WHERE config_key = 'cron_secret';
  
  -- Send HTTP request to Edge Function using correct pg_net syntax
  SELECT net.http_post(
    url := COALESCE(edge_function_url, 'https://vfqxzqhitumrxshrcqwr.supabase.co/functions/v1/weekly-summary'),
    body := jsonb_build_object('data', summary_data),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(cron_secret, 'panoramic-weekly-summary-2024')
    )
  ) INTO request_id;
  
  -- Log the result in weekly_summary_log
  INSERT INTO weekly_summary_log (
    week_start_date,
    week_end_date,
    contacts_included,
    email_stats,
    summary_sent_at,
    resend_message_id
  ) VALUES (
    DATE(start_date),
    DATE(end_date),
    COALESCE(
      (SELECT jsonb_agg(contact->>'email_hash') 
       FROM jsonb_array_elements(summary_data->'weekly_contacts') AS contact),
      '[]'::jsonb
    ),
    summary_data->'email_stats',
    NOW(),
    'http_request_' || request_id::text
  )
  ON CONFLICT (week_start_date) DO UPDATE SET
    contacts_included = EXCLUDED.contacts_included,
    email_stats = EXCLUDED.email_stats,
    summary_sent_at = EXCLUDED.summary_sent_at,
    resend_message_id = EXCLUDED.resend_message_id;
  
  -- Log success
  INSERT INTO cron_job_log (job_name, status, message, details) 
  VALUES ('weekly_summary', 'success', 'Weekly summary HTTP request sent', 
          jsonb_build_object(
            'contacts_count', jsonb_array_length(COALESCE(summary_data->'weekly_contacts', '[]'::jsonb)),
            'emails_sent', (summary_data->'email_stats'->>'total_sent')::int,
            'request_id', request_id,
            'edge_function_url', edge_function_url
          ));
  
EXCEPTION WHEN OTHERS THEN
  -- Log errors to our simple cron log table
  INSERT INTO cron_job_log (job_name, status, message, details) 
  VALUES ('weekly_summary', 'error', SQLERRM, 
          jsonb_build_object(
            'error_detail', SQLERRM,
            'start_date', start_date,
            'end_date', end_date,
            'timestamp', NOW()
          ));
END;
$function$;

-- Fix trigger_weekly_summary_manual
CREATE OR REPLACE FUNCTION public.trigger_weekly_summary_manual()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result JSONB;
BEGIN
  -- Call the same function that cron calls
  PERFORM send_weekly_summary();
  
  -- Return success message
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Weekly summary triggered manually',
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  SELECT jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- ============================================================================
-- 2. FIX VIEWS WITH SECURITY DEFINER
-- ============================================================================

-- Recreate marketing_insights view without SECURITY DEFINER
DROP VIEW IF EXISTS public.marketing_insights CASCADE;

CREATE VIEW public.marketing_insights AS
SELECT 
  email_reports.id,
  email_reports.user_email,
  email_reports.first_name,
  email_reports.last_name,
  email_reports.email_hash,
  email_reports.created_at,
  email_reports.resend_message_id,
  CASE
    WHEN email_reports.user_count = 1 THEN 'Micro (1-10 users)'::text
    WHEN email_reports.user_count = 2 THEN 'Small (11-50 users)'::text
    WHEN email_reports.user_count = 3 THEN 'Medium (51-200 users)'::text
    WHEN email_reports.user_count = 4 THEN 'Large (201-1000 users)'::text
    WHEN email_reports.user_count = 5 THEN 'Enterprise (1000+ users)'::text
    ELSE 'Unknown'::text
  END AS company_size,
  CASE
    WHEN email_reports.project_volume_annually = 1 THEN 'Low Volume (<10 projects/year)'::text
    WHEN email_reports.project_volume_annually = 2 THEN 'Small Volume (10-29 projects/year)'::text
    WHEN email_reports.project_volume_annually = 3 THEN 'Medium Volume (30-99 projects/year)'::text
    WHEN email_reports.project_volume_annually = 4 THEN 'High Volume (100-499 projects/year)'::text
    WHEN email_reports.project_volume_annually = 5 THEN 'Very High Volume (500+ projects/year)'::text
    ELSE 'Unknown'::text
  END AS project_volume,
  CASE
    WHEN email_reports.tasks_per_project = 1 THEN 'Simple Projects (<20 tasks)'::text
    WHEN email_reports.tasks_per_project = 2 THEN 'Small Projects (20-99 tasks)'::text
    WHEN email_reports.tasks_per_project = 3 THEN 'Medium Projects (100-499 tasks)'::text
    WHEN email_reports.tasks_per_project = 4 THEN 'Large Projects (500-999 tasks)'::text
    WHEN email_reports.tasks_per_project = 5 THEN 'Complex Projects (1000+ tasks)'::text
    ELSE 'Unknown'::text
  END AS project_complexity,
  CASE
    WHEN email_reports.user_expertise_level = 1 THEN 'Technical Users'::text
    WHEN email_reports.user_expertise_level = 2 THEN 'Mostly Technical'::text
    WHEN email_reports.user_expertise_level = 3 THEN 'Mixed Technical/Business'::text
    WHEN email_reports.user_expertise_level = 4 THEN 'Mostly Business Users'::text
    WHEN email_reports.user_expertise_level = 5 THEN 'Non-Technical Users'::text
    ELSE 'Unknown'::text
  END AS user_sophistication,
  email_reports.departments,
  email_reports.methodologies,
  CASE
    WHEN (email_reports.top_recommendations IS NOT NULL) AND (jsonb_array_length(email_reports.top_recommendations) > 0) 
    THEN ((email_reports.top_recommendations -> 0) -> 'tool'::text) ->> 'name'::text
    ELSE NULL::text
  END AS preferred_tool_1,
  CASE
    WHEN (email_reports.top_recommendations IS NOT NULL) AND (jsonb_array_length(email_reports.top_recommendations) > 1) 
    THEN ((email_reports.top_recommendations -> 1) -> 'tool'::text) ->> 'name'::text
    ELSE NULL::text
  END AS preferred_tool_2,
  CASE
    WHEN (email_reports.top_recommendations IS NOT NULL) AND (jsonb_array_length(email_reports.top_recommendations) > 2) 
    THEN ((email_reports.top_recommendations -> 2) -> 'tool'::text) ->> 'name'::text
    ELSE NULL::text
  END AS preferred_tool_3,
  email_reports.has_guided_data,
  email_reports.tool_count,
  email_reports.criteria_count,
  email_reports.user_agent
FROM email_reports
WHERE email_reports.created_at >= '2025-01-01 00:00:00+00'::timestamp with time zone
ORDER BY email_reports.created_at DESC;

-- Recreate admin_tools_view without SECURITY DEFINER
DROP VIEW IF EXISTS public.admin_tools_view CASCADE;

CREATE VIEW public.admin_tools_view AS
SELECT 
  t.id,
  t.name,
  t.type,
  t.created_by,
  t.created_on,
  t.submission_status,
  t.submitted_at,
  t.approved_at,
  t.updated_at,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'criteria_id', ct.criteria_id,
      'name', c.name,
      'ranking', ct.ranking,
      'description', ct.description
    )) FILTER (WHERE ct.criteria_id IS NOT NULL),
    '[]'::json
  ) AS criteria,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', tg.id,
      'name', tg.name,
      'type', tt.name
    )) FILTER (WHERE tg.id IS NOT NULL),
    '[]'::json
  ) AS tags
FROM tools t
LEFT JOIN criteria_tools ct ON ct.tool_id = t.id
LEFT JOIN criteria c ON c.id = ct.criteria_id
LEFT JOIN tag_tools tgj ON tgj.tool_id = t.id
LEFT JOIN tags tg ON tg.id = tgj.tag_id
LEFT JOIN tag_type tt ON tt.id = tg.tag_type_id
GROUP BY t.id;

-- ============================================================================
-- 3. FIX RLS POLICIES WITH AUTH FUNCTION CALLS
-- ============================================================================

-- Fix weekly_summary_log policy
DROP POLICY IF EXISTS "Admin users can view weekly summaries" ON public.weekly_summary_log;

CREATE POLICY "Admin users can view weekly summaries"
  ON public.weekly_summary_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Fix system_config policy
DROP POLICY IF EXISTS "Admin users can manage system config" ON public.system_config;

CREATE POLICY "Admin users can manage system config"
  ON public.system_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Fix cron_job_log policy
DROP POLICY IF EXISTS "Admin users can view cron job logs" ON public.cron_job_log;

CREATE POLICY "Admin users can view cron job logs"
  ON public.cron_job_log
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 4. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES ON TOOLS TABLE
-- ============================================================================

-- Drop the two separate SELECT policies
DROP POLICY IF EXISTS "Consolidated SELECT policy for tools" ON public.tools;
DROP POLICY IF EXISTS "Public can read approved application tools" ON public.tools;

-- Create a single consolidated SELECT policy that handles both authenticated and public access
-- This combines the two previous policies into one for better performance
CREATE POLICY "Consolidated SELECT policy for tools"
  ON public.tools
  FOR SELECT
  TO public
  USING (
    -- Allow approved application tools for everyone (public access)
    ((type = 'application'::tool_type) AND (submission_status = 'approved'::submission_status))
    OR
    -- Allow authenticated users additional access: admin tools, or their own user tools
    (
      (SELECT auth.uid()) IS NOT NULL AND
      (
        is_admin() OR 
        ((SELECT auth.uid()) = created_by)
      )
    )
  );

-- ============================================================================
-- 5. MOVE PG_NET EXTENSION FROM PUBLIC SCHEMA
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net extension to extensions schema
-- Note: In Supabase, extensions can be moved but may require special handling
DO $$
BEGIN
  -- Check if extension exists and is in public schema
  IF EXISTS (
    SELECT 1 
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pg_net' AND n.nspname = 'public'
  ) THEN
    -- Try to move the extension to extensions schema
    ALTER EXTENSION pg_net SET SCHEMA extensions;
    RAISE NOTICE 'Successfully moved pg_net extension to extensions schema';
  ELSE
    RAISE NOTICE 'pg_net extension not found in public schema or already moved';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If moving fails, log the error but don't fail the migration
  -- The extension will remain in public schema (this is a warning, not critical)
  RAISE WARNING 'Could not move pg_net extension to extensions schema: %. Extension remains in public schema. This is a security warning but will not break functionality.', SQLERRM;
END;
$$;

