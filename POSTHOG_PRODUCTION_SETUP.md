# PostHog Production Domain Configuration

## Changes Made

### 1. Updated PostHog Configuration (`src/instrumentation-client.ts`)

**Added Production Domain Settings:**
- `secure_cookie: true` - Ensures HTTPS cookies for production
- `cross_subdomain_cookie: true` - Enables cookie sharing across subdomains (already configured)
- Enhanced domain validation and logging
- Added domain and site_url to default event properties

**Enhanced Logging:**
- Domain validation warnings for production environment
- Better debugging information for development
- Production domain confirmation logging

### 2. Updated Comments and Documentation
- Updated UniversalBumperEngine comments to reflect production focus
- Updated UniversalBumperStateManager comments for production optimization

## Environment Variables Required

Ensure these environment variables are set in your production environment (Netlify):

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NODE_ENV=production
```

## PostHog Dashboard Configuration

In your PostHog project dashboard, ensure:

1. **Allowed Domains**: Add these domains to your project settings:
   - `panoramic-solutions.com`
   - `*.panoramic-solutions.com`

2. **CORS Settings**: Verify these origins are allowed:
   - `https://panoramic-solutions.com`
   - `https://www.panoramic-solutions.com`

3. **Project URL**: Set to `https://panoramic-solutions.com`

## Verification Steps

### 1. Browser Developer Tools Check
1. Open `https://panoramic-solutions.com`
2. Open Developer Tools → Network tab
3. Look for successful requests to `us.i.posthog.com` (200 status)
4. Check Application → Cookies → Look for PostHog cookies under `panoramic-solutions.com`

### 2. Console Verification
In the browser console on `panoramic-solutions.com`, run:
```javascript
// Check PostHog is loaded
console.log('PostHog loaded:', !!window.posthog);

// Check configuration
console.log('PostHog config:', window.posthog?.config);

// Check current domain
console.log('Current domain:', window.location.hostname);

// Check registered properties
console.log('Registered properties:', window.posthog?.get_property('domain'));
```

### 3. PostHog Dashboard Check
1. Go to your PostHog project
2. Check "Live Events" to see real-time events from `panoramic-solutions.com`
3. Verify the `$host` property shows `panoramic-solutions.com`
4. Look for the new `domain` and `site_url` properties in events

## Expected Behavior

### Production Environment (`panoramic-solutions.com`)
- PostHog cookies set with domain `.panoramic-solutions.com`
- Secure cookies enabled (HTTPS only)
- Console log: "🎯 PostHog tracking active on production domain"
- All events include `domain` and `site_url` properties

### Development Environment (`localhost`)
- Standard PostHog configuration without domain restrictions
- Detailed logging for debugging
- Console logs show domain and environment information

### Warning Scenarios
- If `NODE_ENV=production` but not on production domain, you'll see:
  `⚠️ PostHog: Production environment detected but not on production domain: [domain]`

## Custom Events Being Tracked

Your site tracks these custom events:
- `New_Visitor` - First-time visitors
- `New_Active` - Users who take their first action
- `New_Ranking_Submittal` - PPM tool ranking submissions
- `New_Report_Sent` - Email report generations
- `button_click` - Button interactions
- `form_submission` - Form submissions
- `tool_usage` - PPM tool interactions

All events now include attribution data and domain information.

## Troubleshooting

### Events Not Appearing
1. Check environment variables in Netlify dashboard
2. Verify PostHog project allows `panoramic-solutions.com`
3. Check browser console for PostHog errors
4. Test in incognito mode to avoid cached issues

### Cookie Issues
1. Ensure site is served over HTTPS
2. Check that `secure_cookie: true` is working
3. Verify cookie domain is set correctly in browser dev tools

### Domain Validation Warnings
1. Ensure `NODE_ENV=production` is set correctly in production
2. Verify deployment is actually on `panoramic-solutions.com`
3. Check for any subdomain redirects or proxies
