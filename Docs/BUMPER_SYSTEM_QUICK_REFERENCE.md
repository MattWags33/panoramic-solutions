# 🎯 Bumper System - Quick Reference

**Last Updated**: 2025-01-28  
**Status**: ✅ Consolidated and Production-Ready

---

## 🚀 Quick Start

### Console Commands (Available in Production)

```javascript
// Primary test suite
universalBumperTest.status()      // Show full status
universalBumperTest.product()     // Trigger Product Bumper
universalBumperTest.exit()        // Trigger Exit Intent
universalBumperTest.reset()       // Clear state and reload
universalBumperTest.force()       // Skip timing conditions
universalBumperTest.diagnose()    // Full diagnostic report

// Legacy test suite (still works)
bumperTest.status()               // Check status
bumperTest.runAll()               // Full test sequence
```

### Keyboard Shortcuts

- **Ctrl+Shift+Q** - Trigger Product Bumper
- **Ctrl+Shift+X** - Trigger Exit Intent Bumper
- **Ctrl+Shift+D** - Show debug info
- **Ctrl+Shift+R** - Reset all state

---

## 📁 File Structure (What's What)

### ✅ **ACTIVE SYSTEM** (Use These)

```
src/ppm-tool/
├── shared/
│   ├── engines/
│   │   └── UniversalBumperEngine.ts          ← Core logic & timing
│   ├── state/
│   │   └── UniversalBumperStateManager.ts    ← Single source of truth
│   ├── hooks/
│   │   ├── useUnifiedMouseTracking.ts        ← Mouse detection
│   │   └── useUnifiedExitIntent.ts           ← Exit detection
│   └── contexts/
│       └── GuidanceContext.tsx               ← Business logic
├── components/
│   ├── UniversalBumperProvider.tsx           ← React integration
│   └── overlays/
│       ├── ProductBumper.tsx                 ← Product Bumper UI
│       └── ExitIntentBumper.tsx              ← Exit Intent UI
```

### ⚠️ **COMPATIBILITY LAYER** (Legacy Support)

```
src/ppm-tool/shared/utils/
└── unifiedBumperState.ts                     ← Delegates to UniversalBumperStateManager
```

> **Note**: New code should use `UniversalBumperStateManager` directly

### ❌ **DELETED** (Duplicates Removed)

- `BumperSystemProvider.tsx` (replaced by UniversalBumperProvider)
- `productionBumperEngine.ts` (replaced by UniversalBumperEngine)

---

## ⏱️ Timing Logic

| Bumper | Trigger | Cooldown | Blocks |
|--------|---------|----------|--------|
| **Product Bumper** | 10s + 3s (mouse stopped) | 23s after Exit Intent | Guided Rankings clicked |
| **Exit Intent Bumper** | 2min OR page leave | 23s after Product Bumper | Guided Rankings clicked, Comparison Report closed |

### Product Bumper Rules
- ✅ Shows after: 10s initial timer + 3s mouse stopped
- 🚫 Never shows if: User clicked Guided Rankings, any overlay open
- ⏳ Cooldown: 23s after Exit Intent dismissed

### Exit Intent Bumper Rules
- ✅ Shows after: 2 minutes OR mouse leaving/tab switch
- 🚫 Never shows if: User clicked Guided Rankings, Comparison Report was closed
- ⏳ Cooldown: 23s after Product Bumper dismissed

---

## 🔧 Common Modifications

### Change Timing Constants

**File**: `src/ppm-tool/shared/engines/UniversalBumperEngine.ts` (lines 13-18)

```typescript
const TIMING_CONSTANTS = {
  INITIAL_TIMER_MS: 10000,        // Change this for initial delay
  MOUSE_MOVEMENT_TIMER_MS: 3000,  // Change this for mouse stopped delay
  EXIT_INTENT_TIMER_MS: 120000,   // Change this for exit intent delay
  POST_BUMPER_DELAY_MS: 23000,    // Change this for cross-bumper cooldown
};
```

### Change Trigger Logic

**File**: `src/ppm-tool/shared/engines/UniversalBumperEngine.ts`

- `shouldShowProductBumper()` (line 254) - Product Bumper conditions
- `shouldShowExitIntentBumper()` (line 301) - Exit Intent conditions

### Add State Field

**File**: `src/ppm-tool/shared/state/UniversalBumperStateManager.ts`

1. Add field to `BumperState` interface (line 9)
2. Add default value in `getDefaultState()` (line 124)
3. Add recording method if needed (line 223+)

### Change Bumper UI

**Files**:
- Product Bumper: `src/ppm-tool/components/overlays/ProductBumper.tsx`
- Exit Intent: `src/ppm-tool/components/overlays/ExitIntentBumper.tsx`

---

## 📊 State Fields Reference

### Timing
- `toolOpenedAt` - When user opened tool
- `initialTimerComplete` - 10s timer done?
- `mouseStoppedAt` - When mouse stopped
- `mouseMovementTimerComplete` - 3s timer done?

### User Actions
- `hasClickedIntoGuidedRankings` - Clicked GR (blocks bumpers)
- `hasClickedIntoComparisonReport` - Clicked CR
- `guidedRankingsOpenedAt/ClosedAt` - GR session times
- `comparisonReportOpenedAt/ClosedAt` - CR session times

### Bumper States
- `productBumperShown/Dismissed/DismissedAt` - Product Bumper lifecycle
- `exitIntentShown/Dismissed/DismissedAt` - Exit Intent lifecycle

### Current UI
- `isAnyBumperCurrentlyOpen` - Any bumper visible?
- `isGuidedRankingsCurrentlyOpen` - GR modal open?
- `isComparisonReportCurrentlyOpen` - CR modal open?

---

## 🐛 Debugging

### Check System Status

```javascript
// Full status report
universalBumperTest.status()

// Or individual pieces
const state = stateManager.getState()
const engine = universalBumperEngine.getStatus()
```

### Force Trigger (Skip Timers)

```javascript
// Skip all timing conditions
universalBumperTest.force()

// Then trigger
universalBumperTest.product()  // or .exit()
```

### Reset Everything

```javascript
// Clear all state and reload
universalBumperTest.reset()
```

---

## 📚 Full Documentation

For complete architecture details, see:
**`Docs/json/bumper-system-architecture.json`**

Includes:
- Complete file listing with responsibilities
- Detailed modification guide
- State field reference
- Timing logic breakdown
- Migration notes

---

## ✅ Cleanup Summary (2025-01-28)

### Deleted
- ❌ `BumperSystemProvider.tsx` (duplicate)
- ❌ `productionBumperEngine.ts` (duplicate)

### Refactored
- ♻️ `unifiedBumperState.ts` → now delegates to UniversalBumperStateManager
- ♻️ `productionTestHelpers.ts` → updated to use UniversalBumperEngine

### Result
- ✅ Single, consolidated system
- ✅ No duplicate logic
- ✅ Clear architecture layers
- ✅ Production-ready and tested

---

**Questions?** Check `Docs/json/bumper-system-architecture.json` for detailed answers.

