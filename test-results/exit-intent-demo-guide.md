# Exit Intent Trigger Scenarios - Live Browser Demo

## Setup Complete ✅
Page loaded and ready for testing all Exit Intent trigger scenarios.

## Scenarios We'll Test:

### Scenario 1: Mouse Leave (Mouse goes off screen to top)
**Trigger:** Moving mouse to top of browser window
**Code:** `mouseleave` event when `y <= exitThreshold`
**What we'll do:** Move mouse cursor to top of browser window

### Scenario 2: Tab Switch (User switches to another tab)
**Trigger:** User switches browser tab
**Code:** `visibilitychange` event when `document.hidden === true`
**What we'll do:** Simulate tab switch via JavaScript

### Scenario 3: All Blocking Conditions
- When Email Modal is open
- When Guided Rankings is open
- When How It Works is open
- After Comparison Report closed (permanent)
- 23s delay after Product Bumper closed

Let's proceed with live demonstrations!

