# 🔗 Connect Supabase + PostHog for Accurate Analytics

## Overview

This guide walks you through connecting your Supabase analytics database to PostHog's Data Warehouse feature. Once connected, your PostHog dashboards will have access to detailed user-level data from Supabase, ensuring the most accurate and comprehensive analytics.

## ✅ Benefits

- **Single Source of Truth**: PostHog dashboards query live Supabase data
- **No Data Drift**: Automatic hourly sync keeps everything up-to-date
- **Powerful SQL Queries**: Join PostHog events with Supabase user sessions, tool actions, etc.
- **Enhanced Insights**: Answer complex questions like "Which guided ranking answers lead to most conversions?"
- **Executive Visibility**: Combine high-level metrics with detailed context

## 🎯 What You'll Connect

**From Supabase Analytics Database:**
- `users` table → User sessions, UTM tracking, conversion status
- `user_question_responses` → Guided ranking answers
- `user_criteria_responses` → Manual criteria sliders
- `user_tool_actions` → Tool interactions (Try Free, View Details, Compare)
- `recommendations` → Email report conversions
- `questions` + `question_choices` → Reference data

**To PostHog Data Warehouse:**
- Automatic sync every hour
- Available for SQL insights, dashboards, and queries
- Joins with PostHog events using `session_id` = `distinct_id`

---

## 📋 Setup Steps

### Step 1: Get Your Supabase Database Password

1. Go to [Supabase Database Settings](https://supabase.com/dashboard/project/ikqxrzhtdymkjmgxejxu/settings/database)
2. Scroll to **Connection String** section
3. Find your **Database Password** (or reset it if you don't have it)
4. **IMPORTANT**: This is your `postgres` user password, NOT your API key
5. **Copy and save it** - you'll need it for Step 2

> 💡 **Tip**: If you reset your password, make sure to update it in any existing connections (like local dev)

---

### Step 2: Create PostHog Data Warehouse Source

1. Go to [PostHog Data Pipeline Sources](https://us.posthog.com/project/211080/pipeline/sources)
2. Click **"New source"**
3. Select **"Postgres"** from the list
4. Enter your connection details:

```
Source Name: Supabase Analytics
Host: db.ikqxrzhtdymkjmgxejxu.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [Your password from Step 1]
Schema: analytics
SSL Mode: require
```

5. Click **"Test Connection"** - should see ✅ success
6. Click **"Save"**

---

### Step 3: Select Tables to Sync

After saving the source, you'll be prompted to select tables:

#### ✅ Select These Tables (Incremental Sync):

| Table Name | Sync Mode | Sync Key | Purpose |
|------------|-----------|----------|---------|
| `analytics.users` | Incremental | `updated_at` | User sessions, UTM data, conversion status |
| `analytics.user_question_responses` | Incremental | `answered_at` | Guided ranking answers |
| `analytics.user_criteria_responses` | Incremental | `created_at` | Manual criteria ratings |
| `analytics.user_tool_actions` | Incremental | `created_at` | Tool clicks (Try Free, View, Compare) |
| `analytics.recommendations` | Incremental | `created_at` | Email report conversions |

#### ✅ Select These Tables (Full Refresh):

| Table Name | Sync Mode | Purpose |
|------------|-----------|---------|
| `analytics.questions` | Full Refresh | Reference table (small, rarely changes) |
| `analytics.question_choices` | Full Refresh | Reference table (small, rarely changes) |

#### ⚙️ Sync Settings:
- **Sync Frequency**: Every 1 hour (recommended)
- **Start Date**: Leave blank to sync all historical data

> 💡 **What's the difference?**
> - **Incremental Sync**: Only syncs new/updated rows (efficient for large tables)
> - **Full Refresh**: Re-syncs entire table each time (fine for small reference tables)

---

### Step 4: Verify the Integration

#### 4a. Run Verification Query in Supabase

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/ikqxrzhtdymkjmgxejxu/sql/new)
2. Open `scripts/get-supabase-connection-info.sql` (in your repo)
3. Run queries #4 and #5 to get current row counts
4. **Save these numbers** - you'll compare them in PostHog

#### 4b. Run Verification Query in PostHog

1. Go to [PostHog SQL Insights](https://us.posthog.com/project/211080/insights/new)
2. Select **"SQL"** insight type
3. Run this query:

```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  MAX(updated_at) as latest_user_update
FROM analytics_users;
```

4. **Compare results** with Supabase numbers from 4a
5. ✅ **Success** if counts match (±1 for timing)

#### 4c. Test a Join Query

Verify you can join PostHog events with Supabase data:

```sql
SELECT 
  e.event,
  u.initial_utm_source,
  u.has_converted,
  COUNT(*) as event_count
FROM events e
JOIN analytics_users u ON e.distinct_id = u.session_id
WHERE e.timestamp > '2025-11-01'
  AND e.event IN ('New_Active', 'New_Report_Sent')
GROUP BY e.event, u.initial_utm_source, u.has_converted
ORDER BY event_count DESC
LIMIT 10;
```

✅ **Success** if you see events grouped by UTM source

---

### Step 5: Create Your First Combined Insight

Let's create a powerful insight that combines PostHog events with Supabase data:

**Insight: "Tool Try Free Clicks with Match Score Context"**

1. Go to [PostHog Insights](https://us.posthog.com/project/211080/insights/new)
2. Select **"SQL"** insight type
3. Enter this query:

```sql
SELECT 
  t.tool_name,
  AVG(t.match_score) as avg_match_score,
  COUNT(*) as try_free_clicks,
  ROUND(AVG(t.position), 1) as avg_position
FROM analytics_user_tool_actions t
WHERE t.action_type = 'try_free'
  AND t.created_at > NOW() - INTERVAL '30 days'
GROUP BY t.tool_name
ORDER BY try_free_clicks DESC
LIMIT 10;
```

4. Name it: **"🚀 Top Tools - Try Free Clicks with Context"**
5. Click **"Save"**
6. Add it to your **"PPM Tool - Executive Metrics"** dashboard

**Why This Is Powerful:**
- Shows which tools get the most Try Free clicks ✅
- Reveals average match score (trust in recommendations) ✅
- Shows average position (ranking matters?) ✅
- All from Supabase data, queryable in PostHog ✅

---

## 🎨 Next-Level Insights You Can Now Create

With Supabase data in PostHog, you can answer questions like:

### 💰 Monetization Insights

```sql
-- Which departments generate most Try Free clicks?
SELECT 
  r.departments,
  COUNT(DISTINCT t.user_id) as users_with_try_free_clicks,
  COUNT(t.action_id) as total_try_free_clicks
FROM analytics_recommendations r
JOIN analytics_user_tool_actions t ON r.user_id = t.user_id
WHERE t.action_type = 'try_free'
GROUP BY r.departments
ORDER BY total_try_free_clicks DESC;
```

### 📊 Conversion Analysis

```sql
-- Conversion rate by number of guided ranking questions answered
SELECT 
  question_count,
  COUNT(DISTINCT u.user_id) as total_users,
  COUNT(DISTINCT r.user_id) as converted_users,
  ROUND(100.0 * COUNT(DISTINCT r.user_id) / COUNT(DISTINCT u.user_id), 2) as conversion_rate
FROM (
  SELECT user_id, COUNT(*) as question_count
  FROM analytics_user_question_responses
  GROUP BY user_id
) u
LEFT JOIN analytics_recommendations r ON u.user_id = r.user_id
GROUP BY question_count
ORDER BY question_count;
```

### ⚡ Engagement Patterns

```sql
-- Time to conversion by traffic source
SELECT 
  u.initial_utm_source,
  COUNT(r.user_id) as conversions,
  ROUND(AVG(EXTRACT(EPOCH FROM (r.created_at - u.first_seen_at)) / 3600), 2) as avg_hours_to_convert,
  MIN(EXTRACT(EPOCH FROM (r.created_at - u.first_seen_at)) / 3600) as fastest_hours
FROM analytics_users u
JOIN analytics_recommendations r ON u.user_id = r.user_id
WHERE u.initial_utm_source IS NOT NULL
GROUP BY u.initial_utm_source
HAVING COUNT(r.user_id) >= 5
ORDER BY avg_hours_to_convert;
```

### 🎯 Tool Performance

```sql
-- Tool click-through rate by position in results
SELECT 
  position,
  COUNT(DISTINCT CASE WHEN action_type = 'view_details' THEN action_id END) as views,
  COUNT(DISTINCT CASE WHEN action_type = 'try_free' THEN action_id END) as try_free,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN action_type = 'try_free' THEN action_id END) / 
    NULLIF(COUNT(DISTINCT CASE WHEN action_type = 'view_details' THEN action_id END), 0), 2) as view_to_try_free_rate
FROM analytics_user_tool_actions
WHERE position <= 10
GROUP BY position
ORDER BY position;
```

---

## 🔍 Monitoring & Maintenance

### Weekly Health Check

1. **Verify Sync Status**
   - Go to [PostHog Data Pipeline](https://us.posthog.com/project/211080/pipeline/sources)
   - Check **"Last synced"** timestamp (should be within 1 hour)
   - Click **"View Logs"** - should have no errors

2. **Verify Row Counts Growing**
   ```sql
   SELECT 
     'users' as table_name,
     COUNT(*) as row_count,
     MAX(updated_at) as latest_record
   FROM analytics_users
   UNION ALL
   SELECT 
     'tool_actions',
     COUNT(*),
     MAX(created_at)
   FROM analytics_user_tool_actions;
   ```
   Run this weekly and compare to previous week - should be increasing

3. **Check for Data Gaps**
   ```sql
   -- Verify no missing days
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as actions
   FROM analytics_user_tool_actions
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```
   Should see consistent daily counts (no zero days)

---

## 🚨 Troubleshooting

### Problem: Connection Failed

**Symptoms**: "Could not connect to database" error

**Solutions**:
1. ✅ Verify database password is correct (postgres user, not API key)
2. ✅ Check Supabase project is not paused
3. ✅ Verify host is `db.ikqxrzhtdymkjmgxejxu.supabase.co` (NOT `api.supabase.co`)
4. ✅ Ensure SSL mode is `require`
5. ✅ Check [Connection Pooling](https://supabase.com/dashboard/project/ikqxrzhtdymkjmgxejxu/settings/database) is enabled

### Problem: Tables Not Showing

**Symptoms**: Can't see `analytics` schema or tables

**Solutions**:
1. ✅ Verify `analytics` schema exists:
   ```sql
   SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'analytics';
   ```
2. ✅ Check postgres user has permissions on analytics schema
3. ✅ Try selecting `public` schema first to test connection

### Problem: Data Not Syncing

**Symptoms**: Row counts in PostHog don't match Supabase

**Solutions**:
1. ✅ Check [PostHog Source Logs](https://us.posthog.com/project/211080/pipeline/sources) for errors
2. ✅ Verify incremental sync keys exist:
   ```sql
   SELECT table_name, column_name 
   FROM information_schema.columns
   WHERE table_schema = 'analytics' 
     AND column_name IN ('updated_at', 'created_at', 'answered_at');
   ```
3. ✅ Manually trigger a sync to test
4. ✅ Check sync schedule is set to hourly

### Problem: Queries Are Slow

**Symptoms**: SQL insights take > 30 seconds

**Solutions**:
1. ✅ Add indexes on commonly queried columns:
   ```sql
   CREATE INDEX idx_users_utm_source ON analytics.users(initial_utm_source);
   CREATE INDEX idx_tool_actions_type ON analytics.user_tool_actions(action_type);
   CREATE INDEX idx_tool_actions_created ON analytics.user_tool_actions(created_at);
   ```
2. ✅ Limit query date ranges with WHERE clauses
3. ✅ Use incremental sync instead of full refresh
4. ✅ Consider creating materialized views for complex queries

---

## 📚 Additional Resources

- **Technical Spec**: See `docs/json/supabase-posthog-integration.json` for full details
- **Connection Info Script**: Run `scripts/get-supabase-connection-info.sql` in Supabase
- **PostHog Data Warehouse Docs**: https://posthog.com/docs/cdp/sources
- **Supabase Connection Docs**: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## ✅ Success Checklist

- [ ] Got Supabase database password
- [ ] Created PostHog Data Warehouse source
- [ ] Connected successfully (test connection passed)
- [ ] Selected all 7 analytics tables
- [ ] Set sync frequency to hourly
- [ ] Verified row counts match between systems
- [ ] Ran test join query successfully
- [ ] Created first combined insight
- [ ] Added insight to Executive Metrics dashboard
- [ ] Set up weekly monitoring (optional but recommended)

---

**🎉 Once complete, your PostHog dashboards will have access to the most accurate, up-to-date data from both systems!**

