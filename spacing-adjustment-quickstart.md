# Quick Start: Adjusting Device-Specific Spacing

## File to Edit
`src/ppm-tool/components/layout/NavigationToggle.tsx`

---

## Visual Layout

```
┌─────────────────────────────────────┐
│         HEADER (Panoramic)          │ ← Line 72-96: getHeaderHeight()
│  topPadding + logoHeight + bottom   │
└─────────────────────────────────────┘
         ↓ gap (0px mobile, 8px desktop)
┌─────────────────────────────────────┐
│   NAVIGATION TOGGLES (3 tabs)       │ ← Line 100-130: getNavigationHeight()
│  topPadding + contentHeight +       │
│  bottomPadding + logoSpacing +      │
│  extraSpacing                       │
└─────────────────────────────────────┘
         ↓ logoSpacing + extraSpacing
┌─────────────────────────────────────┐
│   PPM TOOL FINDER LOGO (mobile)     │
│   (scrollable content area)         │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   MAIN CONTENT                      │
│   (Rank Your Criteria, etc.)        │
└─────────────────────────────────────┘
```

---

## Most Common Adjustments

### 1. Fix Tablet Overlap Issue
**Location**: Line 119
```typescript
// In tablet section (768-1023px)
const extraSpacing = 16; // ← Change from 8 to 16
```

### 2. Reduce Phone Spacing  
**Location**: Line 108
```typescript
// In phone section (≤767px)
const logoSpacing = -32; // ← Change from -16 to -32
```

### 3. Add More Space on Phone
**Location**: Line 109
```typescript
// In phone section (≤767px)
const extraSpacing = 8; // ← Change from 0 to 8
```

---

## The Three Independent Sections

### 📱 Phone Section (Lines 103-110)
```typescript
if (deviceType === 'phone') {
  const topPadding = 2;
  const bottomPadding = 2;
  const contentHeight = 40;
  const logoSpacing = -16;    // ← ADJUST FOR PHONE ONLY
  const extraSpacing = 0;     // ← ADJUST FOR PHONE ONLY
  return topPadding + bottomPadding + contentHeight + logoSpacing + extraSpacing;
}
```

### 📲 Tablet Section (Lines 113-120)
```typescript
if (deviceType === 'tablet') {
  const topPadding = 2;
  const bottomPadding = 2;
  const contentHeight = 40;
  const logoSpacing = -16;    // ← ADJUST FOR TABLET ONLY
  const extraSpacing = 8;     // ← ADJUST FOR TABLET ONLY
  return topPadding + bottomPadding + contentHeight + logoSpacing + extraSpacing;
}
```

### 🖥️ Desktop Section (Lines 123-129)
```typescript
// Desktop: Standard spacing
const topPadding = 8;
const bottomPadding = 8;
const contentHeight = 40;
const logoSpacing = 0;        // ← ADJUST FOR DESKTOP ONLY
const extraSpacing = 28;      // ← ADJUST FOR DESKTOP ONLY
return topPadding + bottomPadding + contentHeight + logoSpacing + extraSpacing;
```

---

## What Each Value Does

### `logoSpacing`
Controls space between navigation and logo below it:
- **Negative** (`-32`, `-16`): Pulls content UP (less space)
- **Zero** (`0`): Neutral
- **Positive** (`8`, `16`): Pushes content DOWN (more space)

### `extraSpacing`
Adds additional breathing room:
- `0`: Minimal (flush)
- `8`: Standard
- `16`: Spacious
- `28`: Desktop standard

---

## Test Your Changes

1. Save the file
2. Refresh browser (Ctrl+R / Cmd+R)
3. Open DevTools (F12)
4. Toggle device toolbar
5. Test each size:
   - **375px** = Phone
   - **768px** = Tablet
   - **1440px** = Desktop

---

## Pro Tips

💡 **Start with tablet first** - It's the problematic one  
💡 **Make small adjustments** - Change by 4-8px at a time  
💡 **Test on real devices** - DevTools may not show actual behavior  
💡 **One device at a time** - Don't adjust all three at once  

---

## Current Working Values

| Device  | logoSpacing | extraSpacing | Total Nav Height |
|---------|-------------|--------------|------------------|
| Phone   | -16         | 0            | 28px            |
| Tablet  | -16         | 8            | 36px            |
| Desktop | 0           | 28           | 84px            |

Adjust these to your needs - they won't affect each other! 🎉

