'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { bumperEngine } from '@/ppm-tool/shared/utils/productionBumperEngine';
import { useUnifiedMouseTracking } from '@/ppm-tool/shared/hooks/useUnifiedMouseTracking';
import { useUnifiedExitIntent } from '@/ppm-tool/shared/hooks/useUnifiedExitIntent';
import { useGuidance } from '@/ppm-tool/shared/contexts/GuidanceContext';

interface BumperSystemContextType {
  initialized: boolean;
  status: any;
}

const BumperSystemContext = createContext<BumperSystemContextType>({
  initialized: false,
  status: null
});

export const useBumperSystem = () => useContext(BumperSystemContext);

interface BumperSystemProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Client-only wrapper that ensures bumpers work consistently in production
 */
export function BumperSystemProvider({ children, enabled = true }: BumperSystemProviderProps) {
  const [initialized, setInitialized] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const { triggerProductBumper, triggerExitIntentBumper } = useGuidance();

  // Initialize engine with proper hydration handling
  useEffect(() => {
    if (!enabled) return;

    // Mark container for hydration detection
    const container = document.querySelector('.ppm-tool-container');
    if (container) {
      container.setAttribute('data-bumper-ready', 'true');
    }

    // Initialize engine
    const initEngine = async () => {
      try {
        const success = await bumperEngine.initialize();
        setInitialized(success);
        setStatus(bumperEngine.getStatus());
        
        if (success) {
          console.log('[BumperSystem] ✅ Fully initialized in production');
        }
      } catch (error) {
        console.error('[BumperSystem] Initialization error:', error);
      }
    };

    // Add small delay to ensure all components are mounted
    const timer = setTimeout(initEngine, 250);

    return () => clearTimeout(timer);
  }, [enabled]);

  // Mouse tracking with production safety
  useUnifiedMouseTracking({
    enabled: enabled && initialized,
    onInitialTimerComplete: () => {
      console.log('[BumperSystem] Initial timer complete callback');
    },
    onMouseMovementTimerComplete: () => {
      console.log('[BumperSystem] Mouse timer complete callback');
    }
  });

  // Exit intent with production safety
  useUnifiedExitIntent({
    enabled: enabled && initialized,
    onTriggerExitIntentBumper: (type) => {
      console.log('[BumperSystem] Exit intent triggered:', type);
      triggerExitIntentBumper(type);
    }
  });

  // Production debugging (temporary)
  useEffect(() => {
    if (typeof window !== 'undefined' && initialized) {
      (window as any).__bumperStatus = () => ({
        initialized,
        engineStatus: bumperEngine.getStatus(),
        timestamp: new Date().toISOString()
      });
    }
  }, [initialized]);

  return (
    <BumperSystemContext.Provider value={{ initialized, status }}>
      {children}
    </BumperSystemContext.Provider>
  );
}
