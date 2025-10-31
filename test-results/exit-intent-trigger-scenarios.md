# Exit Intent Bumper - All Trigger Scenarios Test

## Scenarios to Test:

1. **Mouse Leave (Mouse goes off screen to top)** ✅
   - Move mouse to top of browser window
   - Should trigger Exit Intent if eligible

2. **Tab Switch (User switches to another tab)** ✅
   - Simulate tab visibility change
   - Should trigger Exit Intent if eligible

3. **2-Minute Timer (Time-based trigger)** ✅
   - Wait 2 minutes after tool opens
   - Should make Exit Intent eligible

4. **Criteria Adjustment Requirement** ✅
   - Need 3+ criteria adjusted
   - Exit Intent only eligible if criteria met

5. **Blocking Scenarios:**
   - When Email Modal is open ❌
   - When Guided Rankings is open ❌
   - When How It Works is open ❌
   - After Comparison Report closed ❌ (permanent)
   - When Product Bumper just closed (23s delay) ⏱️

Let's test each scenario!

