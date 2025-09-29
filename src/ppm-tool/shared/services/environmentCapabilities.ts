/**
 * Environment Layer - Capability Detection Service
 * 
 * Handles device detection, browser capabilities, and environment constraints.
 * Provides fallback strategies for different environments.
 * Separated from UI logic to prevent coupling issues.
 */

import { useState, useEffect, useCallback } from 'react';

export interface EnvironmentCapabilities {
  // Device Capabilities
  isTouchDevice: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Browser Capabilities
  supportsPortals: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsPointerEvents: boolean;
  
  // Display Capabilities
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  
  // Performance Indicators
  isLowEndDevice: boolean;
  hasGoodConnection: boolean;
  
  // Environment Constraints
  isSSR: boolean;
  isCorporateNetwork: boolean;
  isPrivateBrowsing: boolean;
}

export interface EnvironmentStrategy {
  // Rendering Strategy
  usePortals: boolean;
  useSimpleTooltips: boolean;
  useReducedAnimations: boolean;
  
  // Storage Strategy
  storageMethod: 'localStorage' | 'sessionStorage' | 'memory' | 'none';
  
  // Interaction Strategy
  interactionMethod: 'hover' | 'click' | 'touch' | 'focus';
  
  // Fallback Strategy
  fallbackLevel: 'full' | 'reduced' | 'minimal' | 'none';
}

/**
 * Detect environment capabilities with graceful fallbacks
 */
export function useEnvironmentCapabilities(): EnvironmentCapabilities {
  const [capabilities, setCapabilities] = useState<EnvironmentCapabilities>(() => {
    // SSR-safe initial state
    return {
      isTouchDevice: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      supportsPortals: true,
      supportsLocalStorage: false,
      supportsSessionStorage: false,
      supportsPointerEvents: false,
      screenWidth: 1024,
      screenHeight: 768,
      pixelRatio: 1,
      isLowEndDevice: false,
      hasGoodConnection: true,
      isSSR: true,
      isCorporateNetwork: false,
      isPrivateBrowsing: false,
    };
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const detectCapabilities = (): EnvironmentCapabilities => {
      // Device Detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      const isMobile = screenWidth < 768 || /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = !isMobile && (screenWidth < 1024 || /ipad|tablet/i.test(userAgent));
      const isDesktop = !isMobile && !isTablet;

      // Browser Capabilities
      const supportsPortals = typeof document !== 'undefined' && 'createElement' in document;
      const supportsPointerEvents = 'PointerEvent' in window;
      
      // Storage Detection with Corporate Policy Handling
      let supportsLocalStorage = false;
      let supportsSessionStorage = false;
      let isPrivateBrowsing = false;
      let isCorporateNetwork = false;

      try {
        const testKey = '__test_storage__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        supportsLocalStorage = true;
      } catch (e) {
        // Could be private browsing, corporate policy, or storage quota
        if (e instanceof DOMException) {
          if (e.code === 22 || e.name === 'QuotaExceededError') {
            isPrivateBrowsing = true;
          } else if (e.name === 'SecurityError') {
            isCorporateNetwork = true;
          }
        }
      }

      try {
        const testKey = '__test_session__';
        sessionStorage.setItem(testKey, 'test');
        sessionStorage.removeItem(testKey);
        supportsSessionStorage = true;
      } catch (e) {
        // Similar handling as localStorage
      }

      // Performance Detection
      const pixelRatio = window.devicePixelRatio || 1;
      const isLowEndDevice = (
        navigator.hardwareConcurrency <= 2 ||
        (navigator as any).deviceMemory <= 2 ||
        screenWidth * screenHeight * pixelRatio < 1000000
      );

      // Connection Detection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const hasGoodConnection = !connection || connection.effectiveType !== 'slow-2g';

      return {
        isTouchDevice,
        isMobile,
        isTablet,
        isDesktop,
        supportsPortals,
        supportsLocalStorage,
        supportsSessionStorage,
        supportsPointerEvents,
        screenWidth,
        screenHeight,
        pixelRatio,
        isLowEndDevice,
        hasGoodConnection,
        isSSR: false,
        isCorporateNetwork,
        isPrivateBrowsing,
      };
    };

    const newCapabilities = detectCapabilities();
    setCapabilities(newCapabilities);

    // Listen for changes
    const handleResize = () => {
      setCapabilities(prev => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return capabilities;
}

/**
 * Determine the best strategy based on environment capabilities
 */
export function useEnvironmentStrategy(capabilities: EnvironmentCapabilities): EnvironmentStrategy {
  return {
    // Rendering Strategy
    usePortals: capabilities.supportsPortals && !capabilities.isLowEndDevice,
    useSimpleTooltips: capabilities.isLowEndDevice || capabilities.isCorporateNetwork,
    useReducedAnimations: capabilities.isLowEndDevice || !capabilities.hasGoodConnection,
    
    // Storage Strategy
    storageMethod: capabilities.supportsLocalStorage 
      ? 'localStorage' 
      : capabilities.supportsSessionStorage 
        ? 'sessionStorage' 
        : 'memory',
    
    // Interaction Strategy
    interactionMethod: capabilities.isTouchDevice 
      ? 'touch' 
      : capabilities.isMobile 
        ? 'click' 
        : 'hover',
    
    // Fallback Strategy
    fallbackLevel: capabilities.isSSR 
      ? 'none'
      : capabilities.isLowEndDevice || capabilities.isCorporateNetwork
        ? 'minimal'
        : capabilities.isMobile
          ? 'reduced'
          : 'full',
  };
}

/**
 * Memory storage fallback for environments where localStorage is blocked
 */
class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

/**
 * Safe storage that adapts to environment capabilities
 */
export function useSafeStorage(capabilities: EnvironmentCapabilities) {
  const memoryStorage = new MemoryStorage();

  const getStorage = useCallback(() => {
    if (capabilities.supportsLocalStorage) {
      return localStorage;
    }
    if (capabilities.supportsSessionStorage) {
      return sessionStorage;
    }
    return memoryStorage;
  }, [capabilities.supportsLocalStorage, capabilities.supportsSessionStorage, memoryStorage]);

  return {
    storage: getStorage(),
    isMemoryOnly: !capabilities.supportsLocalStorage && !capabilities.supportsSessionStorage,
    isPersistent: capabilities.supportsLocalStorage,
  };
}

/**
 * Environment-aware component renderer
 */
export function useEnvironmentRenderer(capabilities: EnvironmentCapabilities) {
  return {
    // Should render component at all?
    shouldRender: !capabilities.isSSR,
    
    // Should use Portal rendering?
    shouldUsePortal: capabilities.supportsPortals && !capabilities.isLowEndDevice,
    
    // Should use reduced functionality?
    shouldUseReducedMode: capabilities.isLowEndDevice || capabilities.isCorporateNetwork,
    
    // Should defer rendering for performance?
    shouldDeferRender: capabilities.isLowEndDevice && !capabilities.hasGoodConnection,
  };
}
