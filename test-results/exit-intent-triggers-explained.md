# Exit Intent Bumper - All Trigger Scenarios Explained

## How Exit Intent Detection Works

Based on `useUnifiedExitIntent.ts`, Exit Intent can be triggered in two ways:

### Trigger #1: Mouse Leave (Mouse goes off screen) 🖱️
**Event:** `mouseleave` on `document`
**Conditions:**
- Mouse Y position <= `exitThreshold` (0 for Chrome, -5 for Safari, -2 for Firefox)
- OR mouse in corner exits (y <= 100 AND (x <= 100 OR x >= viewportWidth - 100))
- OR side exits near top (y <= 150 AND (x <= exitThreshold OR x >= viewportWidth - exitThreshold))

**Code Location:** `src/ppm-tool/shared/hooks/useUnifiedExitIntent.ts:108-156`

**When it triggers:**
- User moves mouse to top of browser window (towards address bar)
- User moves mouse to top-left or top-right corners
- User moves mouse off screen at top

### Trigger #2: Tab Switch (User switches to another tab) 🔄
**Event:** `visibilitychange` on `document`
**Condition:** `document.hidden === true`

**Code Location:** `src/ppm-tool/shared/hooks/useUnifiedExitIntent.ts:158-175`

**When it triggers:**
- User clicks another browser tab
- User Alt+Tab to another application
- Browser tab becomes hidden

## Requirements for Both Triggers:

1. ✅ **3+ Criteria Adjusted** - User must have adjusted at least 3 criteria sliders
2. ✅ **2 Minutes on Page** - Tool must be open for at least 2 minutes
3. ✅ **Home State** - No overlays open (Email Modal, Guided Rankings, etc.)
4. ✅ **Not Permanently Blocked** - Comparison Report not closed, Guided Rankings not clicked
5. ✅ **Desktop Device** - Not a mobile/tablet (touch-screen laptops OK)
6. ✅ **Not Already Triggered** - Exit Intent hasn't been shown yet

## Keyboard Shortcut:
**Ctrl+Shift+X** - Triggers Exit Intent Bumper (for testing)

## Console Logs to Watch For:

- `🚪 Triggering Exit Intent Bumper via mouse leave (3+ criteria adjusted)`
- `🚪 Triggering Exit Intent Bumper via tab switch (3+ criteria adjusted)`
- `🚫 Exit Intent PERMANENTLY DISABLED` (when blocked)
- `🎯 Exit Intent Eligibility: X/7 criteria adjusted - ❌ NOT ELIGIBLE (need 3+)`

## How to Test Each Scenario:

### Test Mouse Leave:
1. Adjust 3+ criteria sliders
2. Wait for conditions to be met
3. Move mouse to top of browser window
4. Exit Intent should appear

### Test Tab Switch:
1. Adjust 3+ criteria sliders  
2. Wait for conditions to be met
3. Click another browser tab or Alt+Tab
4. Exit Intent should appear when you return

### Test Blocking:
- Open Email Modal → Try mouse leave → Exit Intent should NOT appear
- Open Guided Rankings → Try tab switch → Exit Intent should NOT appear
- Close Comparison Report → Try triggers → Exit Intent PERMANENTLY blocked

