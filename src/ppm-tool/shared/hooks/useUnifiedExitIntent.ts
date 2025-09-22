/**
 * Unified Exit Intent Hook
 * Integrates with the unified bumper state management system
 * Handles both ProductBumper and ExitIntentBumper triggering based on complex timing rules
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  shouldShowProductBumper,
  shouldShowExitIntentBumper,
  getUnifiedBumperState,
  getUnifiedBumperTimingConstants
} from '../utils/unifiedBumperState';

interface UseUnifiedExitIntentOptions {
  enabled?: boolean;
  onTriggerProductBumper?: () => void;
  onTriggerExitIntentBumper?: (triggerType: 'mouse-leave' | 'tab-switch') => void;
}

interface BrowserInfo {
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isMobile: boolean;
}

const getBrowserInfo = (): BrowserInfo => {
  if (typeof window === 'undefined') {
    return { isChrome: false, isFirefox: false, isSafari: false, isEdge: false, isMobile: false };
  }
  
  const userAgent = navigator.userAgent;
  const isEdgeDetected = /Edg/.test(userAgent);
  
  // Enhanced Edge detection for better Utah/Edge compatibility
  console.log(`🌐 Exit Intent Browser Detection: ${isEdgeDetected ? 'Microsoft Edge' : 'Other'} | UA: ${userAgent.substring(0, 50)}...`);
  
  return {
    isChrome: /Chrome/.test(userAgent) && !/Edg/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: isEdgeDetected,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent)
  };
};

export function useUnifiedExitIntent(options: UseUnifiedExitIntentOptions = {}) {
  const { enabled = true, onTriggerProductBumper, onTriggerExitIntentBumper } = options;
  
  const [hasTriggeredProductBumper, setHasTriggeredProductBumper] = useState(false);
  const [hasTriggeredExitIntent, setHasTriggeredExitIntent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [browserInfo] = useState(getBrowserInfo());
  
  const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0, time: 0 });
  const checkTimersRef = useRef<NodeJS.Timeout | null>(null);
  
  const { EXIT_INTENT_TIMER_MS } = getUnifiedBumperTimingConstants();
  
  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      const isTouchDevice = 'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
      const isMobileUA = browserInfo.isMobile;
      setIsMobile(width < 768 || isTouchDevice || isMobileUA);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [browserInfo.isMobile]);
  
  // Periodic check for timing-based triggers
  useEffect(() => {
    if (!enabled || isMobile) return;
    
    const checkTimingBasedTriggers = () => {
      // Check if Product Bumper should be shown
      if (!hasTriggeredProductBumper && shouldShowProductBumper()) {
        console.log('🎯 Triggering Product Bumper via timing check');
        setHasTriggeredProductBumper(true);
        onTriggerProductBumper?.();
        return; // Don't check for exit intent if we're showing product bumper
      }
      
      // Check if Exit Intent should be shown (but not from mouse leave)
      if (!hasTriggeredExitIntent && shouldShowExitIntentBumper()) {
        const state = getUnifiedBumperState();
        const toolOpenedAt = new Date(state.toolOpenedAt).getTime();
        const timeOnPage = Date.now() - toolOpenedAt;
        
        // Only auto-trigger after 2 minutes (exit intent timer)
        if (timeOnPage >= EXIT_INTENT_TIMER_MS) {
          console.log('🚪 Triggering Exit Intent Bumper via 2-minute timer');
          setHasTriggeredExitIntent(true);
          onTriggerExitIntentBumper?.('tab-switch'); // Use tab-switch as default for timer trigger
        }
      }
    };
    
    // Check every 1 second
    checkTimersRef.current = setInterval(checkTimingBasedTriggers, 1000);
    
    return () => {
      if (checkTimersRef.current) {
        clearInterval(checkTimersRef.current);
      }
    };
  }, [enabled, isMobile, hasTriggeredProductBumper, hasTriggeredExitIntent, EXIT_INTENT_TIMER_MS, onTriggerProductBumper, onTriggerExitIntentBumper]);
  
  // Mouse leave detection for exit intent
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isMobile) return;
    
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger exit intent if it should be shown
      if (!shouldShowExitIntentBumper()) {
        return;
      }
      
      // Get normalized coordinates
      const x = e.clientX;
      const y = e.clientY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Browser-specific adjustments
      let exitThreshold = 0;
      if (browserInfo.isSafari) {
        exitThreshold = -5;
      } else if (browserInfo.isFirefox) {
        exitThreshold = -2;
      }
      
      // Exit detection conditions
      const conditions = [
        y <= exitThreshold, // Top exit
        (y <= 100 && (x <= 100 || x >= viewportWidth - 100)), // Corner exits
        (y <= 150 && (x <= exitThreshold || x >= viewportWidth - exitThreshold)) // Side exits near top
      ];
      
      if (conditions.some(condition => condition)) {
        console.log('🚪 Triggering Exit Intent Bumper via mouse leave');
        setHasTriggeredExitIntent(true);
        onTriggerExitIntentBumper?.('mouse-leave');
      }
    };
    
    // Add event listener
    try {
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    } catch (e) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, hasTriggeredExitIntent, isMobile, browserInfo, onTriggerExitIntentBumper]);
  
  // Tab switch detection for exit intent
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isMobile) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && shouldShowExitIntentBumper()) {
        console.log('🚪 Triggering Exit Intent Bumper via tab switch');
        setHasTriggeredExitIntent(true);
        onTriggerExitIntentBumper?.('tab-switch');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, hasTriggeredExitIntent, isMobile, onTriggerExitIntentBumper]);
  
  // Mouse movement tracking for enhanced exit detection
  useEffect(() => {
    if (!enabled || hasTriggeredExitIntent || isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Clear existing timeout
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
      
      // Update position tracking
      const currentTime = Date.now();
      const currentPos = { x: e.clientX, y: e.clientY, time: currentTime };
      const lastPos = lastMousePositionRef.current;
      
      // Calculate movement velocity
      const timeDiff = currentTime - lastPos.time;
      const yMovement = timeDiff > 0 ? (currentPos.y - lastPos.y) / timeDiff : 0;
      
      lastMousePositionRef.current = currentPos;
      
      // Browser-specific thresholds
      const topZone = browserInfo.isSafari ? 80 : 
                     browserInfo.isFirefox ? 70 : 
                     browserInfo.isEdge ? 65 : 60;  // Edge needs slightly different threshold
      const cornerZone = browserInfo.isSafari ? 120 : 
                        browserInfo.isFirefox ? 110 : 
                        browserInfo.isEdge ? 105 : 100;  // Edge corner detection
      const headerZone = window.innerWidth < 768 ? 144 : 152;
      
      // Detection zones
      const zones = {
        browserChrome: currentPos.y <= topZone,
        topCorners: currentPos.y <= cornerZone && 
                   (currentPos.x <= 150 || currentPos.x >= window.innerWidth - 150),
        rapidUpward: yMovement < -0.5 && currentPos.y <= 200,
        header: currentPos.y <= headerZone
      };
      
      // Determine trigger zone and delay
      let delay = 0;
      let zone = '';
      
      if (zones.browserChrome) {
        delay = 500;
        zone = 'browser-chrome';
      } else if (zones.topCorners) {
        delay = 600;
        zone = 'top-corners';
      } else if (zones.rapidUpward) {
        delay = 700;
        zone = 'rapid-upward';
      } else if (zones.header) {
        delay = 1000;
        zone = 'header';
      }
      
      if (delay > 0 && shouldShowExitIntentBumper()) {
        mouseLeaveTimeoutRef.current = setTimeout(() => {
          console.log(`🚪 Triggering Exit Intent Bumper via mouse movement (${zone})`);
          setHasTriggeredExitIntent(true);
          onTriggerExitIntentBumper?.('mouse-leave');
        }, delay);
      }
    };
    
    // Add event listener
    try {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
    } catch (e) {
      document.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, [enabled, hasTriggeredExitIntent, isMobile, browserInfo, onTriggerExitIntentBumper]);
  
  // Reset function for testing
  const reset = useCallback(() => {
    setHasTriggeredProductBumper(false);
    setHasTriggeredExitIntent(false);
  }, []);
  
  return {
    hasTriggeredProductBumper,
    hasTriggeredExitIntent,
    isMobile,
    browserInfo,
    reset
  };
}
