# Device-Specific Spacing Configuration Guide

**File**: `src/ppm-tool/components/layout/NavigationToggle.tsx`  
**Lines**: 61-130

---

## Overview

The spacing calculations are now **completely independent** for each device type:
- **Phone** (≤767px)
- **Tablet** (768-1023px)  
- **Desktop** (>1023px)

**Key Change**: Adjusting spacing for one device type will **NOT** affect the others.

---

## Header Height Configuration

### Location: Lines 72-96

### Phone (≤767px)
```typescript
const topPadding = 32;
const bottomPadding = 8;
const logoHeight = 12;
```
**Total**: 52px

### Tablet (768-1023px)
```typescript
const topPadding = 32;
const bottomPadding = 8;
const logoHeight = 12;
```
**Total**: 52px

### Desktop (>1023px)
```typescript
const topPadding = 8;
const bottomPadding = 8;
const logoHeight = 45;
```
**Total**: 61px

---

## Navigation Height Configuration

### Location: Lines 100-130

### Phone (≤767px) - Lines 103-110
```typescript
const topPadding = 2;
const bottomPadding = 2;
const contentHeight = 40;     // Tab height
const logoSpacing = -16;      // ⚠️ ADJUST THIS for phone spacing
const extraSpacing = 0;
```
**Total**: 28px

**What to adjust**:
- `logoSpacing`: Negative values pull content UP, positive values push DOWN
  - `-32` = more compact (pull content up)
  - `-16` = default
  - `0` = no adjustment
  - `8` = push content down slightly

### Tablet (768-1023px) - Lines 113-120
```typescript
const topPadding = 2;
const bottomPadding = 2;
const contentHeight = 40;
const logoSpacing = -16;      // ⚠️ ADJUST THIS for tablet spacing
const extraSpacing = 8;       // ⚠️ Extra clearance to prevent overlap
```
**Total**: 36px

**What to adjust**:
- `logoSpacing`: Same as phone, but affects ONLY tablet
- `extraSpacing`: Additional spacing below navigation
  - `0` = minimal spacing
  - `8` = default (prevents overlap)
  - `16` = more breathing room

### Desktop (>1023px) - Lines 123-129
```typescript
const topPadding = 8;
const bottomPadding = 8;
const contentHeight = 40;
const logoSpacing = 0;        // No logo in navigation on desktop
const extraSpacing = 28;
```
**Total**: 84px

---

## Quick Reference: Common Adjustments

### Problem: Navigation tabs overlapping content on tablet
**Solution**: Increase `extraSpacing` in tablet section (line 119)
```typescript
const extraSpacing = 16; // Increase from 8 to 16
```

### Problem: Too much space between logo and content on phone
**Solution**: Decrease `logoSpacing` in phone section (line 108)
```typescript
const logoSpacing = -32; // Decrease from -16 to -32
```

### Problem: Logo too close to navigation tabs on phone
**Solution**: Increase `extraSpacing` in phone section (line 109)
```typescript
const extraSpacing = 8; // Increase from 0 to 8
```

### Problem: Header and navigation too far apart on tablet
**Solution**: Adjust the gap in NavigationToggle style (line 239)
```typescript
top: `${getHeaderHeight() + (isMobile ? 0 : 4)}px`,
// Change desktop value from 8 to 4, or adjust isMobile logic
```

---

## Testing Workflow

1. **Open Developer Tools** in your browser
2. **Toggle Device Toolbar** (Ctrl+Shift+M / Cmd+Shift+M)
3. **Test each breakpoint**:
   - Phone: 375px width (iPhone)
   - Tablet: 768px width (iPad)
   - Desktop: 1440px width

4. **Adjust values** in the corresponding device section
5. **Refresh** and verify spacing
6. **Repeat** for other device types independently

---

## Architecture Benefits

### Before (Single isMobile Boolean)
```
❌ Changing mobileLogoSpacing = -32 affected ALL mobile devices
❌ Tablet and Phone treated identically  
❌ Desktop could be affected by "mobile" changes
```

### After (Device-Specific Detection)
```
✅ Phone values are completely isolated
✅ Tablet values are completely isolated
✅ Desktop values are completely isolated
✅ Each device can be fine-tuned independently
```

---

## Device Detection Logic

### Location: Lines 61-68

```typescript
const getDeviceType = useCallback(() => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width <= 767) return 'phone';      // ≤767px
  if (width <= 1023) return 'tablet';    // 768-1023px
  return 'desktop';                       // >1023px
}, []);
```

This runs on:
- Component mount
- Window resize
- Orientation change

---

## Debugging Tips

### View Current Device Type
Add this temporary log in `getDeviceType()`:
```typescript
const deviceType = width <= 767 ? 'phone' : width <= 1023 ? 'tablet' : 'desktop';
console.log('Device:', deviceType, 'Width:', width);
return deviceType;
```

### View Calculated Heights
Add temporary logs in the useEffect (line 176):
```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const totalHeight = getTotalFixedHeight();
    console.log('Total Fixed Height:', totalHeight, 'Device:', getDeviceType());
    document.documentElement.style.setProperty('--total-fixed-height', `${totalHeight}px`);
  }
}, [isMobile, getTotalFixedHeight]);
```

### Inspect CSS Variable
In Browser DevTools Console:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--total-fixed-height')
```

---

## Related Files

These files use the `--total-fixed-height` CSS variable:

1. **`src/ppm-tool/components/common/EmbeddedPPMToolFlow.tsx`** (line 963)
   ```typescript
   paddingTop: "calc(var(--total-fixed-height, 12rem) + 1rem)"
   ```

2. **`src/components/layout/Header.tsx`**
   - Header positioning affects the calculations

---

## Current Values Summary

| Device  | Header Height | Nav Height | Total | Notes |
|---------|--------------|------------|-------|-------|
| Phone   | 52px         | 28px       | 80px  | Compact, minimal spacing |
| Tablet  | 52px         | 36px       | 88px  | Extra 8px to prevent overlap |
| Desktop | 61px         | 84px       | 145px | Standard spacing |

---

## Important Notes

⚠️ **The `logoSpacing` variable affects content BELOW the navigation, not the logo itself**
- Negative values: Pull content UP (less space below nav)
- Positive values: Push content DOWN (more space below nav)

⚠️ **Changes take effect on**:
- Page refresh
- Window resize
- Orientation change

⚠️ **Browser DevTools responsive mode may not perfectly match real devices**
- Always test on actual devices when possible
- iOS Safari may behave differently than Chrome DevTools

