'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getUnifiedBumperState,
  shouldShowProductBumper,
  shouldShowExitIntentBumper,
  recordGuidedRankingsClick,
  recordComparisonReportClick,
  recordGuidedRankingsOpened,
  recordGuidedRankingsClosed,
  recordComparisonReportOpened,
  recordComparisonReportClosed,
  recordProductBumperShown,
  recordProductBumperDismissed,
  recordExitIntentBumperShown,
  recordExitIntentBumperDismissed,
  setBumperCurrentlyOpen
} from '@/ppm-tool/shared/utils/unifiedBumperState';
import { 
  setOverlayOpen, 
  setOverlayClosed, 
  OVERLAY_TYPES 
} from '@/ppm-tool/shared/utils/homeState';

interface GuidanceContextType {
  showManualGuidance: boolean;
  triggerManualGuidance: () => void;
  closeManualGuidance: () => void;
  hasShownManualGuidance: boolean;
  showProductBumper: boolean;
  triggerProductBumper: (bypassRules?: boolean) => void;
  closeProductBumper: () => void;
  hasShownProductBumper: boolean;
  showExitIntentBumper: boolean;
  triggerExitIntentBumper: (triggerType: 'mouse-leave' | 'tab-switch', bypassRules?: boolean) => void;
  closeExitIntentBumper: () => void;
  hasShownExitIntentBumper: boolean;
  exitIntentTriggerType: 'mouse-leave' | 'tab-switch' | null;
  onGuidedRankingStart: () => void;
  onGuidedRankingComplete: () => void;
  onGuidedRankingClick: () => void;
  onComparisonReportClick: () => void;
  onComparisonReportOpen: () => void;
  onComparisonReportClose: () => void;
}

const GuidanceContext = createContext<GuidanceContextType | undefined>(undefined);

interface GuidanceProviderProps {
  children: ReactNode;
  showProductBumper?: boolean;
}

export const GuidanceProvider = ({ children, showProductBumper: externalShowProductBumper }: GuidanceProviderProps) => {
  // Manual guidance state
  const [showManualGuidance, setShowManualGuidance] = useState(false);
  const [hasShownManualGuidance, setHasShownManualGuidance] = useState(false);
  
  // Product bumper state - avoid SSR/hydration mismatch
  const [internalShowProductBumper, setInternalShowProductBumper] = useState(false);
  const [hasShownProductBumper, setHasShownProductBumper] = useState(false);
  
  // Exit intent bumper state
  const [showExitIntentBumper, setShowExitIntentBumper] = useState(false);
  const [hasShownExitIntentBumper, setHasShownExitIntentBumper] = useState(false);
  const [exitIntentTriggerType, setExitIntentTriggerType] = useState<'mouse-leave' | 'tab-switch' | null>(null);
  
  // Set proper state after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // This runs only on client after hydration
      const state = getUnifiedBumperState();
      if (state.productBumperDismissed) {
        setHasShownProductBumper(true);
      }
      
      if (state.exitIntentDismissed) {
        setHasShownExitIntentBumper(true);
      }
    }
  }, []); // Run once on mount

  // Use external state if provided, otherwise use internal state
  const showProductBumper = externalShowProductBumper !== undefined ? externalShowProductBumper : internalShowProductBumper;

  const triggerManualGuidance = () => {
    if (!hasShownManualGuidance) {
      setShowManualGuidance(true);
      setHasShownManualGuidance(true);
    }
  };

  const closeManualGuidance = () => {
    setShowManualGuidance(false);
  };

  const triggerProductBumper = (bypassRules = false) => {
    console.log('🎯 triggerProductBumper called - current state:', { internalShowProductBumper, hasShownProductBumper, bypassRules });
    
    // Use unified state management (unless bypassed for testing)
    if (!bypassRules && !shouldShowProductBumper()) {
      console.log('⚠️ ProductBumper blocked by unified rules');
      return;
    }
    
    // Check if already showing (always check this even with bypass)
    if (internalShowProductBumper) {
      console.log('⚠️ ProductBumper already visible, skipping...');
      return;
    }
    
    console.log('✅ Showing ProductBumper');
    setInternalShowProductBumper(true);
    setHasShownProductBumper(true);
    recordProductBumperShown();
    setBumperCurrentlyOpen(true);
    setOverlayOpen(OVERLAY_TYPES.PRODUCT_BUMPER);
  };

  const closeProductBumper = () => {
    setInternalShowProductBumper(false);
    
    // Record dismissal in unified state
    recordProductBumperDismissed();
    setBumperCurrentlyOpen(false);
    setOverlayClosed(OVERLAY_TYPES.PRODUCT_BUMPER);
    console.log('💾 ProductBumper dismissed - saved to unified state');
    setHasShownProductBumper(true);
  };

  const triggerExitIntentBumper = (triggerType: 'mouse-leave' | 'tab-switch', bypassRules = false) => {
    console.log('🎯 triggerExitIntentBumper called - trigger type:', triggerType, 'bypassRules:', bypassRules);
    
    // Use unified state management (unless bypassed for testing)
    if (!bypassRules && !shouldShowExitIntentBumper()) {
      console.log('⚠️ ExitIntentBumper blocked by unified rules');
      return;
    }
    
    // Check if already showing (always check this even with bypass)
    if (showExitIntentBumper) {
      console.log('⚠️ ExitIntentBumper already visible, skipping...');
      return;
    }
    
    console.log('✅ Showing ExitIntentBumper');
    setExitIntentTriggerType(triggerType);
    setShowExitIntentBumper(true);
    setHasShownExitIntentBumper(true);
    recordExitIntentBumperShown();
    setBumperCurrentlyOpen(true);
    setOverlayOpen(OVERLAY_TYPES.EXIT_INTENT_BUMPER);
  };

  const closeExitIntentBumper = () => {
    setShowExitIntentBumper(false);
    
    // Record dismissal in unified state
    recordExitIntentBumperDismissed();
    setBumperCurrentlyOpen(false);
    setOverlayClosed(OVERLAY_TYPES.EXIT_INTENT_BUMPER);
    console.log('💾 ExitIntentBumper dismissed - saved to unified state');
    setHasShownExitIntentBumper(true);
  };

  const onGuidedRankingStart = () => {
    console.log('🎯 Guided ranking started');
    recordGuidedRankingsOpened();
    setOverlayOpen(OVERLAY_TYPES.GUIDED_RANKINGS);
  };

  const onGuidedRankingComplete = () => {
    console.log('🎯 Guided ranking completed');
    recordGuidedRankingsClosed();
    setOverlayClosed(OVERLAY_TYPES.GUIDED_RANKINGS);
  };

  const onGuidedRankingClick = () => {
    console.log('🎯 User clicked into Guided Rankings');
    recordGuidedRankingsClick();
  };

  const onComparisonReportClick = () => {
    console.log('📊 User clicked into Comparison Report');
    recordComparisonReportClick();
  };

  const onComparisonReportOpen = () => {
    console.log('📊 Comparison Report opened');
    recordComparisonReportOpened();
    setOverlayOpen(OVERLAY_TYPES.COMPARISON_REPORT);
  };

  const onComparisonReportClose = () => {
    console.log('📊 Comparison Report closed');
    recordComparisonReportClosed();
    setOverlayClosed(OVERLAY_TYPES.COMPARISON_REPORT);
    
    // Reset Product Bumper eligibility when Report closes (if user never clicked GR)
    const { getUnifiedBumperState, updateUnifiedBumperState } = require('@/ppm-tool/shared/utils/unifiedBumperState');
    const state = getUnifiedBumperState();
    
    if (!state.hasClickedIntoGuidedRankings) {
      console.log('🔄 Resetting Product Bumper eligibility after Report close (no GR click)');
      updateUnifiedBumperState({
        productBumperShown: false,
        productBumperDismissed: false
      });
      setHasShownProductBumper(false);
    } else {
      console.log('⚠️ Not resetting Product Bumper - user already clicked into Guided Rankings');
    }
  };

  return (
    <GuidanceContext.Provider value={{
      showManualGuidance,
      triggerManualGuidance,
      closeManualGuidance,
      hasShownManualGuidance,
      showProductBumper,
      triggerProductBumper,
      closeProductBumper,
      hasShownProductBumper,
      showExitIntentBumper,
      triggerExitIntentBumper,
      closeExitIntentBumper,
      hasShownExitIntentBumper,
      exitIntentTriggerType,
      onGuidedRankingStart,
      onGuidedRankingComplete,
      onGuidedRankingClick,
      onComparisonReportClick,
      onComparisonReportOpen,
      onComparisonReportClose
    }}>
      {children}
    </GuidanceContext.Provider>
  );
};

export function useGuidance() {
  const ctx = useContext(GuidanceContext);
  if (!ctx) throw new Error('useGuidance must be used within a GuidanceProvider');
  return ctx;
} 