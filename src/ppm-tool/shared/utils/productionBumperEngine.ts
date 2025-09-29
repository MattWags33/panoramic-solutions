'use client';

/**
 * Production-Ready Bumper Engine
 * Ensures consistent behavior across all browsers, devices, and cache states
 */

import { 
  UnifiedBumperState, 
  getUnifiedBumperState, 
  saveUnifiedBumperState,
  shouldShowProductBumper as checkProductBumper,
  shouldShowExitIntentBumper as checkExitIntent,
  recordInitialTimerComplete,
  recordMouseMovementTimerComplete,
  recordMouseStopped,
  recordMouseMovement
} from './unifiedBumperState';

// Browser-specific configurations
const BROWSER_CONFIGS = {
  chrome: { mouseDelay: 100, timerPrecision: 1 },
  firefox: { mouseDelay: 150, timerPrecision: 5 },
  safari: { mouseDelay: 200, timerPrecision: 10 },
  edge: { mouseDelay: 100, timerPrecision: 1 },
  default: { mouseDelay: 200, timerPrecision: 10 }
};

export class ProductionBumperEngine {
  private static instance: ProductionBumperEngine;
  private initialized = false;
  private browserConfig: typeof BROWSER_CONFIGS.default;
  private hydrationComplete = false;
  private initRetries = 0;
  private maxRetries = 3;

  private constructor() {
    this.browserConfig = this.detectBrowserConfig();
  }

  static getInstance(): ProductionBumperEngine {
    if (!ProductionBumperEngine.instance) {
      ProductionBumperEngine.instance = new ProductionBumperEngine();
    }
    return ProductionBumperEngine.instance;
  }

  /**
   * Initialize with hydration safety and retry logic
   */
  async initialize(): Promise<boolean> {
    // Prevent double initialization
    if (this.initialized) return true;

    try {
      // 1. Wait for hydration to complete
      await this.waitForHydration();

      // 2. Validate environment
      if (!this.validateEnvironment()) {
        console.warn('[BumperEngine] Environment validation failed');
        return false;
      }

      // 3. Clean stale state
      this.cleanStaleState();

      // 4. Initialize state if needed
      this.initializeState();

      // 5. Set up cross-browser compatible timers
      this.setupTimers();

      // 6. Set up error recovery
      this.setupErrorRecovery();

      this.initialized = true;
      console.log('[BumperEngine] ✅ Initialized successfully');
      return true;

    } catch (error) {
      console.error('[BumperEngine] Initialization error:', error);
      
      // Retry logic
      if (this.initRetries < this.maxRetries) {
        this.initRetries++;
        console.log(`[BumperEngine] Retrying initialization (${this.initRetries}/${this.maxRetries})`);
        await this.delay(1000 * this.initRetries);
        return this.initialize();
      }
      
      return false;
    }
  }

  /**
   * Wait for React hydration to complete - Enhanced with better detection
   */
  private async waitForHydration(): Promise<void> {
    return new Promise((resolve) => {
      // Check if we're in a browser
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment');
      }

      let checkCount = 0;
      const maxChecks = 50; // Maximum checks before giving up silently

      // Enhanced hydration detection
      const checkHydration = () => {
        checkCount++;
        
        // Strategy 1: Check for React root indicators
        const hasReactRoot = document.querySelector('[data-reactroot]') || 
                           document.querySelector('#__next') ||
                           document.querySelector('[data-react-helmet]') ||
                           document.querySelector('main') ||
                           document.querySelector('[role="main"]');
        
        // Strategy 2: Check for specific app elements
        const hasContent = document.querySelector('.ppm-tool-container') ||
                         document.querySelector('[data-bumper-ready]') ||
                         document.querySelector('nav') ||
                         document.querySelector('header') ||
                         document.body.children.length > 1;
        
        // Strategy 3: Check document ready state
        const isReady = document.readyState === 'complete' || document.readyState === 'interactive';
        
        // Strategy 4: Check if React has rendered (more lenient)
        const hasReactElements = document.querySelectorAll('div, main, section').length > 0 ||
                                document.querySelector('[data-reactroot]') !== null ||
                                document.querySelector('[class*="react"]') !== null;
        
        // More lenient hydration detection - any two conditions met
        const conditionsMet = [hasReactRoot, hasContent, isReady, hasReactElements].filter(Boolean).length;
        
        if (conditionsMet >= 2 || checkCount >= maxChecks) {
          this.hydrationComplete = true;
          if (checkCount < maxChecks) {
            console.log(`[BumperEngine] ✅ Hydration detected after ${checkCount} checks`);
          }
          resolve();
          return;
        }
        
        // Continue checking
        requestAnimationFrame(checkHydration);
      };

      // Start checking immediately for faster detection
      checkHydration();
      
      // Silent fallback after 3 seconds (reduced from 5)
      setTimeout(() => {
        if (!this.hydrationComplete) {
          this.hydrationComplete = true;
          resolve();
        }
      }, 3000);
    });
  }

  /**
   * Detect browser and return appropriate config
   */
  private detectBrowserConfig(): typeof BROWSER_CONFIGS.default {
    if (typeof navigator === 'undefined') return BROWSER_CONFIGS.default;

    const ua = navigator.userAgent;
    
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return BROWSER_CONFIGS.chrome;
    if (/Firefox/.test(ua)) return BROWSER_CONFIGS.firefox;
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return BROWSER_CONFIGS.safari;
    if (/Edg/.test(ua)) return BROWSER_CONFIGS.edge;
    
    return BROWSER_CONFIGS.default;
  }

  /**
   * Validate environment capabilities
   */
  private validateEnvironment(): boolean {
    // Check localStorage
    try {
      const testKey = '__bumper_test__';
      localStorage.setItem(testKey, '1');
      const works = localStorage.getItem(testKey) === '1';
      localStorage.removeItem(testKey);
      if (!works) return false;
    } catch (e) {
      return false;
    }

    // Check timers
    try {
      const id = setTimeout(() => {}, 0);
      clearTimeout(id);
    } catch (e) {
      return false;
    }

    // Check if mobile (disable on mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(navigator.userAgent) ||
                    window.innerWidth < 768 ||
                    ('ontouchstart' in window);
    
    if (isMobile) {
      console.log('[BumperEngine] Mobile detected, disabling bumpers');
      return false;
    }

    return true;
  }

  /**
   * Clean stale state (24+ hours old)
   */
  private cleanStaleState(): void {
    try {
      const state = getUnifiedBumperState();
      if (state.toolOpenedAt) {
        const age = Date.now() - new Date(state.toolOpenedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (age > maxAge) {
          console.log('[BumperEngine] Clearing stale state');
          localStorage.removeItem('unifiedBumperState');
          localStorage.removeItem('ppmToolHomeState');
        }
      }
    } catch (e) {
      console.error('[BumperEngine] Error cleaning state:', e);
    }
  }

  /**
   * Initialize state with current timestamp
   */
  private initializeState(): void {
    const state = getUnifiedBumperState();
    
    // Only set toolOpenedAt if it's not already set
    if (!state.toolOpenedAt) {
      saveUnifiedBumperState({
        ...state,
        toolOpenedAt: new Date().toISOString()
      });
      console.log('[BumperEngine] Set initial toolOpenedAt');
    }
  }

  /**
   * Set up cross-browser compatible timers
   */
  private setupTimers(): void {
    // Initial 10-second timer
    this.setupInitialTimer();
    
    // Mouse tracking
    this.setupMouseTracking();
  }

  /**
   * Set up the initial 23s timer with browser compatibility
   */
  private setupInitialTimer(): void {
    const state = getUnifiedBumperState();
    
    // Check if already complete
    if (state.initialTimerComplete) {
      console.log('[BumperEngine] Initial timer already complete');
      return;
    }

    // Calculate elapsed time
    const elapsed = Date.now() - new Date(state.toolOpenedAt).getTime();
    const remaining = Math.max(0, 10000 - elapsed);
    
    console.log(`[BumperEngine] Starting timer, ${remaining}ms remaining`);
    
    // Use high-precision timer for consistency
    const startTime = performance.now();
    
    const checkTimer = () => {
      const now = performance.now();
      const actualElapsed = now - startTime;
      
      if (actualElapsed >= remaining) {
        recordInitialTimerComplete();
        console.log('[BumperEngine] ✅ Initial 23s timer completed');
      } else {
        // Check again based on browser precision
        setTimeout(checkTimer, this.browserConfig.timerPrecision);
      }
    };
    
    setTimeout(checkTimer, Math.min(remaining, this.browserConfig.timerPrecision));
  }

  /**
   * Set up mouse tracking with browser-specific optimizations
   */
  private setupMouseTracking(): void {
    let mouseStillTimer: number | null = null;
    let lastX = -1;
    let lastY = -1;
    let lastMoveTime = Date.now();

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const x = e.clientX;
      const y = e.clientY;
      
      // Check if mouse actually moved
      if (x === lastX && y === lastY) return;
      
      lastX = x;
      lastY = y;
      lastMoveTime = now;
      
      // Clear existing timer
      if (mouseStillTimer) {
        clearTimeout(mouseStillTimer);
      }
      
      // Record movement
      recordMouseMovement();
      
      // Set up stillness detection
      mouseStillTimer = window.setTimeout(() => {
        // Verify mouse is still in same position
        const stillTime = Date.now() - lastMoveTime;
        if (stillTime >= this.browserConfig.mouseDelay) {
          recordMouseStopped();
          
          // Start 3-second timer
          setTimeout(() => {
            recordMouseMovementTimerComplete();
            console.log('[BumperEngine] ✅ Mouse movement 3s timer completed');
            this.checkBumperEligibility();
          }, 3000);
        }
      }, this.browserConfig.mouseDelay);
    };

    // Add with passive option for better performance
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  /**
   * Check if bumpers should show
   */
  private checkBumperEligibility(): void {
    if (checkProductBumper()) {
      console.log('[BumperEngine] Product bumper eligible for display');
      // Trigger will happen through existing logic
    }
    
    if (checkExitIntent()) {
      console.log('[BumperEngine] Exit intent eligible for display');
      // Trigger will happen through existing logic
    }
  }

  /**
   * Set up error recovery
   */
  private setupErrorRecovery(): void {
    window.addEventListener('error', (event) => {
      if (event.filename?.includes('bumper')) {
        console.error('[BumperEngine] Runtime error:', event.error);
        // Try to recover
        this.initialized = false;
        setTimeout(() => this.initialize(), 5000);
      }
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get engine status
   */
  getStatus(): object {
    return {
      initialized: this.initialized,
      hydrationComplete: this.hydrationComplete,
      browser: this.detectBrowserConfig(),
      state: this.initialized ? getUnifiedBumperState() : null,
      retries: this.initRetries
    };
  }
}

// Export singleton instance
export const bumperEngine = ProductionBumperEngine.getInstance();

// Auto-initialize on import (with enhanced safety)
if (typeof window !== 'undefined') {
  // Wait for next tick to ensure all imports are complete
  Promise.resolve().then(async () => {
    try {
      await bumperEngine.initialize();
    } catch (error) {
      // Silently handle initialization errors to prevent breaking the app
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BumperEngine] Auto-init failed silently:', error);
      }
    }
  });
}
