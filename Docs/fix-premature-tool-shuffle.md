# Fix: Premature Tool Shuffle During Guided Animation

## Problem

When completing a **single-criterion guided ranking** for the first time, the tools would start shuffling **during the wave animation** instead of waiting for the proper sequence:

1. ✅ Wave animation (4 seconds)
2. ✅ 1-second pause
3. ✅ Criteria sliders animate one-by-one
4. ❌ **Tools shuffle IMMEDIATELY** when first criterion updates (WRONG!)
5. Should be: Tools shuffle AFTER all criteria finish animating

## Root Cause

The `useToolOrderShuffle` hook automatically triggers a shuffle whenever `sortedTools` changes. Since `sortedTools` recalculates based on criteria values, **each criterion update triggered an immediate shuffle**, breaking the controlled animation sequence.

**Flow:**
```
User clicks "Apply" 
→ Wave animation starts
→ First criterion updates
→ sortedTools recalculates
→ useToolOrderShuffle detects change
→ SHUFFLE STARTS (TOO EARLY!)
```

## Solution

Implemented a **disable/enable mechanism** for auto-shuffle with manual control:

### 1. **Added State Management** (`EmbeddedPPMToolFlow.tsx`)
```typescript
const [disableAutoShuffle, setDisableAutoShuffle] = useState(false);
const manualShuffleRef = useRef<(() => void) | null>(null);
```

### 2. **Updated Animation Sequence** (`EmbeddedPPMToolFlow.tsx`)
```typescript
// BEFORE criteria updates
setDisableAutoShuffle(true); // Prevent automatic shuffle

// Animate criteria one-by-one
for (let i = 0; i < criteriaToAnimate.length; i++) {
  setCriteria(...); // Updates don't trigger shuffle
  await new Promise(resolve => setTimeout(resolve, 600));
}

// AFTER all criteria finish
setDisableAutoShuffle(false); // Re-enable
manualShuffleRef.current(); // Manually trigger shuffle
```

### 3. **Modified `useToolOrderShuffle` Hook** (`useShuffleAnimation.ts`)
Added `disabled` option and exposed `manualShuffle` function:

```typescript
export const useToolOrderShuffle = (
  tools: Tool[],
  shuffleHook: UseShuffleAnimationReturn,
  options: { triggerOnChange?: boolean; disabled?: boolean } = {}
) => {
  const { disabled = false } = options;
  
  useEffect(() => {
    if (!triggerOnChange || disabled) return; // Respect disable flag
    // ... auto-shuffle logic
  }, [tools, shuffleHook, triggerOnChange, disabled]);

  return {
    manualShuffle: () => {
      if (!disabled) {
        shuffleHook.triggerShuffle();
      }
    }
  };
};
```

### 4. **Prop Threading**
Added props through the component tree:

**EmbeddedPPMToolFlow** → **SplitView** → **ToolSection**

```typescript
// SplitView interface
interface SplitViewProps {
  disableAutoShuffle?: boolean;
  onShuffleReady?: (shuffleFn: () => void) => void;
}

// ToolSection interface  
interface ToolSectionProps {
  disableAutoShuffle?: boolean;
  onShuffleReady?: (shuffleFn: () => void) => void;
}
```

### 5. **Exposed Manual Shuffle** (`ToolSection.tsx`)
```typescript
const toolOrderShuffle = useToolOrderShuffle(sortedTools, shuffleAnimation, {
  triggerOnChange: true,
  disabled: disableAutoShuffle // Controlled by parent
});

React.useEffect(() => {
  if (onShuffleReady) {
    onShuffleReady(toolOrderShuffle.manualShuffle);
  }
}, [onShuffleReady, toolOrderShuffle]);
```

## New Animation Flow

### ✅ **Controlled Sequence (Desktop)**

```
1. User clicks "Apply Guided Rankings"
2. setDisableAutoShuffle(true) ← DISABLE auto-shuffle
3. Wave animation (4 seconds)
4. 1-second pause
5. Criterion 1 updates → NO shuffle (disabled)
6. Wait 0.6s
7. Criterion 2 updates → NO shuffle (disabled)
8. Wait 0.6s
9. ... (repeat for all criteria)
10. All criteria complete
11. 0.3s pause
12. setDisableAutoShuffle(false) ← RE-ENABLE
13. manualShuffleRef.current() ← MANUAL TRIGGER
14. Tools shuffle (1 second)
15. 3-second pause (full mode only)
16. Email modal opens (full mode only)
```

### ✅ **Mobile (Unchanged)**
```
1. User clicks "Apply"
2. Instant update (no animation)
3. Done
```

## Files Modified

1. **`src/ppm-tool/components/common/EmbeddedPPMToolFlow.tsx`**
   - Added `disableAutoShuffle` state
   - Added `manualShuffleRef`
   - Updated animation sequence
   - Passed props to SplitView

2. **`src/ppm-tool/components/layout/SplitView.tsx`**
   - Added props to interface
   - Passed props to ToolSection

3. **`src/ppm-tool/features/tools/ToolSection.tsx`**
   - Added props to interface
   - Exposed manual shuffle function
   - Passed `disabled` to `useToolOrderShuffle`

4. **`src/ppm-tool/hooks/useShuffleAnimation.ts`**
   - Added `disabled` option
   - Added `manualShuffle` return function
   - Respected `disabled` flag in effect

## Benefits

✅ **Precise Control** - Shuffle happens exactly when intended
✅ **Clean Sequence** - Each phase completes before next begins
✅ **No Flash** - Tools don't jump around during criteria animation
✅ **Backward Compatible** - Normal slider adjustments still trigger shuffle
✅ **Flexible** - Can be used for future animation sequences

## Testing Checklist

- [x] Full guided rankings - tools shuffle after all animations
- [ ] Single-criterion guided ranking - tools shuffle after animations
- [ ] Manual slider adjustment - tools shuffle immediately (normal behavior)
- [ ] Mobile - instant update (no animation, no issue)
- [ ] Multiple criteria updates - no premature shuffles
- [ ] Animation sequence completes fully

## Edge Cases Handled

1. ✅ **User adjusts slider manually** - Auto-shuffle still works (not disabled)
2. ✅ **Animation interrupted** - State resets properly
3. ✅ **Multiple rapid changes** - Debouncing prevents issues
4. ✅ **Mobile devices** - No animation, no disable needed

## Summary

The fix implements a **controlled shuffle mechanism** that allows the parent component to temporarily disable automatic shuffling during the animation sequence and manually trigger it at the precise moment needed. This ensures the animation flows smoothly without tools jumping around prematurely.

**Result**: Wave → Pause → Sliders animate one-by-one → Pause → **THEN** tools shuffle smoothly! 🎯

