# Exit Intent Bumper Test Suite - Test Scenarios Documentation

## Overview

This comprehensive test suite validates all scenarios for when the Exit Intent Bumper should appear, testing:
- ✅ 1 minute timer requirement (changed from 2 minutes)
- ✅ Enhanced top bar detection (entire top area, not just corners)
- ✅ Comprehensive debugging logs with `[EXIT_INTENT_DEBUG]` prefix
- ✅ All blocking scenarios (permanent and temporary)
- ✅ All trigger zones (top bar, corners, rapid movement)

## Test File Location

`e2e/exit-intent-bumper-comprehensive.spec.ts`

## Running the Tests

### Option 1: Run all Exit Intent tests
```bash
npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts
```

### Option 2: Run specific scenario
```bash
npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts -g "Scenario 1"
```

### Option 3: Run with UI mode (interactive)
```bash
npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts --ui
```

### Option 4: Run with headed browser (watch the test)
```bash
npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts --headed
```

### Option 5: Run with debug mode
```bash
npx playwright test e2e/exit-intent-bumper-comprehensive.spec.ts --debug
```

## Test Scenarios

### Scenario 1: Timer Requirement (1 Minute)
**Tests:**
1. ✅ Should NOT trigger before 1 minute passes
2. ✅ Should trigger after 1 minute passes

**What it validates:**
- Timer check happens correctly
- Exit Intent respects 1-minute requirement
- Debug logs show timer status

---

### Scenario 2: Criteria Requirement (3+ Criteria)
**Tests:**
1. ✅ Should NOT trigger with less than 3 criteria adjusted
2. ✅ Should trigger with exactly 3 criteria adjusted

**What it validates:**
- Minimum 3 criteria must be adjusted
- Correctly blocks when insufficient criteria
- Correctly triggers when 3+ criteria adjusted

---

### Scenario 3: Mouse Movement Detection Zones
**Tests:**
1. ✅ Top Bar Zone - Entire top area should trigger
2. ✅ Top-Right Corner Zone - X button area should trigger
3. ✅ Top-Left Corner Zone - Menu/new tab area should trigger
4. ✅ Rapid Upward Movement - Moving toward top bar should trigger

**What it validates:**
- All top bar zones detected correctly
- Different trigger zones work as expected
- Zone detection logs are present

---

### Scenario 4: Permanent Blocking Scenarios
**Tests:**
1. ✅ Should NOT trigger after Comparison Report closed (permanent block)
2. ✅ Should NOT trigger after Guided Rankings clicked (permanent block)

**What it validates:**
- Permanent blocks work correctly
- Exit Intent stays blocked after CR closed
- Exit Intent stays blocked after GR clicked

---

### Scenario 5: Temporary Blocking Scenarios
**Tests:**
1. ✅ Should NOT trigger when Guided Rankings is currently open
2. ✅ Should NOT trigger when Comparison Report is currently open

**What it validates:**
- Temporary blocks while overlays are open
- Exit Intent can trigger after overlays close
- State management works correctly

---

### Scenario 6: Debugging Logs Verification
**Tests:**
1. ✅ Console logs should show all debug information

**What it validates:**
- Mouse Position logs present
- Active Zones logs present
- Timer Check logs present
- Should Show Check logs present
- All logs use `[EXIT_INTENT_DEBUG]` prefix

---

### Scenario 7: Edge Cases
**Tests:**
1. ✅ Should handle rapid mouse movement correctly
2. ✅ Should NOT trigger twice (already shown)

**What it validates:**
- Rapid movement doesn't break detection
- Timeout clearing works correctly
- Already-shown state prevents duplicate triggers

## Debugging Logs to Watch For

When running tests, watch console for these log prefixes:

- `🖱️ [EXIT_INTENT_DEBUG] Mouse Position:` - Mouse position tracking
- `📍 [EXIT_INTENT_DEBUG] Active Zones:` - Which zones are active
- `⏱️ [EXIT_INTENT_DEBUG] Timer Check:` - Timer status
- `✅ [EXIT_INTENT_DEBUG] Should Show Check:` - Condition checks
- `⏳ [EXIT_INTENT_DEBUG] Setting trigger timeout:` - Timeout set
- `🚪 [EXIT_INTENT_DEBUG] Trigger timeout fired:` - Timeout fired
- `✅ [EXIT_INTENT_DEBUG] TRIGGERING:` - Successful trigger
- `❌ [EXIT_INTENT_DEBUG] Trigger blocked:` - Blocked trigger
- `⚠️ [EXIT_INTENT_DEBUG] Not setting timeout:` - Conditions not met

## Expected Test Results

### ✅ Passing Tests Should Show:
- Exit Intent appears when all conditions met
- Exit Intent blocked when conditions not met
- Debug logs present for all scenarios
- Zone detection working correctly
- Timer checks working correctly

### ❌ Failing Tests May Indicate:
- Timer not working (check 1-minute requirement)
- Zone detection broken (check top bar detection)
- Blocking logic broken (check state management)
- Missing debug logs (check console logging)

## Test Coverage

- **Total Tests:** 15 scenarios × 3 browsers = 45 tests
- **Browsers:** Chromium, Firefox, WebKit
- **Viewport:** Desktop (1920x1080)
- **Timeout:** 90-120 seconds per test

## Manual Testing Instructions

To test manually with Chrome DevTools:

1. Open PPM Tool page
2. Open Chrome DevTools Console
3. Adjust 3+ criteria sliders
4. Wait 1 minute
5. Move mouse to top bar area
6. Watch console for `[EXIT_INTENT_DEBUG]` logs
7. Verify Exit Intent Bumper appears

## Key Test Data Points

- **Timer:** 1 minute (60000ms) from tool opened
- **Criteria:** Minimum 3 criteria adjusted
- **Zones:** Top bar (100px), corners (100px from edges), rapid upward
- **Delays:** 300ms (top bar), 400ms (top-right), 500ms (top-left), 600ms (rapid), 1000ms (header)

## Troubleshooting

If tests fail:
1. Check console logs for `[EXIT_INTENT_DEBUG]` messages
2. Verify timer requirements (1 minute)
3. Verify criteria count (3+)
4. Check browser console for blocking reasons
5. Verify state is reset between tests

