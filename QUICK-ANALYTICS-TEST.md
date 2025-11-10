# 🧪 Quick Analytics Test (5 Minutes)

## Prerequisites
- Dev server running: `npm run dev`
- Browser DevTools open (F12)
- Supabase project accessible

## Test Steps

### 1. **Reset & Prepare**
```javascript
// In browser console:
localStorage.clear();
// Then refresh page
```

### 2. **Verify Initialization** (30 seconds)
- ✅ Console shows: `📊 Analytics initialized`
- ✅ Console shows: `✅ Supabase client initialized`
- ✅ Network tab shows: `POST rest/v1/rpc/ensure_analytics_user` with `200 OK`

### 3. **Test Guided Rankings** (1 minute)
- Answer 1-2 questions in Guided Rankings
- ✅ Network tab shows: `POST rest/v1/rpc/track_question_response` (for each answer)
- ✅ No errors in console

### 4. **Test Criteria Sliders** (1 minute)
- Move 1-2 criteria sliders
- ✅ Network tab shows: `POST rest/v1/rpc/track_criteria_response` (for each slider)

### 5. **Test Tool Interactions** (2 minutes)
- Click "View Details" on a tool
  - ✅ Network: `track_tool_action` with `action_type: "view_details"`
- Click "Compare" on a tool
  - ✅ Network: `track_tool_action` with `action_type: "add_to_compare"`
- Click "Try Free" (if available)
  - ✅ Network: `track_tool_action` with `action_type: "try_free"`
  - ✅ PostHog event also fires (dual tracking)

### 6. **Verify Database** (1 minute)
```sql
-- Get your session_id from browser console:
-- localStorage.getItem('analytics_session_id')

-- Then query Supabase:
SELECT * FROM analytics.users 
WHERE session_id = 'YOUR_SESSION_ID';

-- Should see:
-- ✅ User record with page_view_count = 1+
-- ✅ UTM data if you used URL parameters
-- ✅ IP address, user agent captured

-- Check question responses:
SELECT * FROM analytics.user_question_responses
WHERE user_id = (SELECT user_id FROM analytics.users WHERE session_id = 'YOUR_SESSION_ID');

-- Check tool actions:
SELECT tool_name, action_type, position, match_score
FROM analytics.user_tool_actions
WHERE user_id = (SELECT user_id FROM analytics.users WHERE session_id = 'YOUR_SESSION_ID')
ORDER BY action_timestamp DESC;
```

### 7. **Test User Persistence** (1 minute)
- Refresh the page (don't clear localStorage)
- Navigate to Guided Rankings
- ✅ Your previous answers should be pre-filled from database!

## Success Criteria
- ✅ All Network requests return `200 OK`
- ✅ No red errors in console (warnings are OK)
- ✅ Database has records for your session
- ✅ Previous answers persist across page refresh

## If Something Fails
1. **Check environment variables** - Most common issue
2. **Check console** - Look for specific error messages
3. **Check Supabase logs** - View RPC function errors
4. **Check docs/json/analytics-testing-plan.json** - Detailed troubleshooting

## Automated Verification Query
Run this in Supabase SQL Editor to see your complete journey:

```sql
-- Replace with your session_id
WITH user_info AS (
  SELECT user_id, session_id, email, first_name, last_name, first_seen_at
  FROM analytics.users
  WHERE session_id = 'YOUR_SESSION_ID'
)
SELECT 
  ui.*,
  (SELECT COUNT(*) FROM analytics.user_question_responses WHERE user_id = ui.user_id) as questions_answered,
  (SELECT COUNT(*) FROM analytics.user_criteria_responses WHERE user_id = ui.user_id) as criteria_rated,
  (SELECT COUNT(*) FROM analytics.user_tool_actions WHERE user_id = ui.user_id) as tool_actions,
  (SELECT COUNT(*) FROM analytics.recommendations WHERE user_id = ui.user_id) as reports_sent
FROM user_info ui;
```

## Expected Result
Should see something like:
```
questions_answered: 2
criteria_rated: 3
tool_actions: 4
reports_sent: 0 (or 1 if you tested email report)
```

---

## 🎯 That's It!
If all these checks pass, your analytics system is working perfectly and ready for production! 🚀

