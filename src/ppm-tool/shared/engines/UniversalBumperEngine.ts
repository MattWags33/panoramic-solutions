'use client';

/**
 * Universal Bumper Engine
 * Production-safe bumper system that works across all browsers and environments
 * Designed for both panoramic-solutions.com and panoramic-solutions-staging.vercel.app
 */

import { stateManager, BumperState } from '../state/UniversalBumperStateManager';
import { capabilityDetector, BrowserCapabilities } from '../state/BrowserCapabilityDetector';

// Timing constants (10 seconds for Product Bumper)
const TIMING_CONSTANTS = {
  INITIAL_TIMER_MS: 10000, // 10 seconds
  MOUSE_MOVEMENT_TIMER_MS: 3000, // 3 seconds
  EXIT_INTENT_TIMER_MS: 120000, // 2 minutes
  POST_BUMPER_DELAY_MS: 23000, // 23 seconds (cross-bumper cooldown)
};

export interface BumperTriggerCallbacks {
  onProductBumperTrigger?: () => void;
  onExitIntentBumperTrigger?: (triggerType: 'mouse-leave' | 'tab-switch') => void;
}

export class UniversalBumperEngine {
  private static instance: UniversalBumperEngine;
  private initialized = false;
  private hydrated = false;
  private capabilities: BrowserCapabilities | null = null;
  private callbacks: BumperTriggerCallbacks = {};
  
  // Timers
  private initialTimer: NodeJS.Timeout | null = null;
  private mouseStoppedTimer: NodeJS.Timeout | null = null;
  private exitIntentTimer: NodeJS.Timeout | null = null;
  
  // Event listeners
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseLeaveHandler: ((e: MouseEvent) => void) | null = null;
  private visibilityChangeHandler: (() => void) | null = null;
  
  // Mouse tracking
  private lastMousePosition = { x: 0, y: 0 };
  private mouseMoveTimeout: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): UniversalBumperEngine {
    if (!this.instance) {
      this.instance = new UniversalBumperEngine();
    }
    return this.instance;
  }
  
  async initialize(callbacks: BumperTriggerCallbacks = {}): Promise<void> {
    if (this.initialized) return;
    
    // Wait for hydration
    if (typeof window === 'undefined') {
      console.log('🔄 Bumper engine waiting for client hydration');
      return;
    }
    
    // Detect browser capabilities
    this.capabilities = await capabilityDetector.detect();
    console.log('🔍 Browser capabilities detected:', this.capabilities);
    
    this.callbacks = callbacks;
    
    // Check if we can run at all
    if (this.capabilities.overallScore < 0.5) {
      console.warn('⚠️ Browser capabilities too low for bumper system');
      return;
    }
    
    // Mark as hydrated and initialized
    this.hydrated = true;
    this.initialized = true;
    
    // Start the system
    this.startTimers();
    this.setupEventListeners();
    
    console.log('✅ Universal Bumper Engine initialized');
  }
  
  private startTimers(): void {
    if (!this.capabilities) return;
    
    const state = stateManager.getState();
    
    // Start initial timer if not already complete
    if (!state.initialTimerComplete) {
      this.startInitialTimer();
    }
    
    // Start exit intent timer if enough time has passed
    if (state.toolOpenedAt) {
      const elapsed = Date.now() - new Date(state.toolOpenedAt).getTime();
      if (elapsed >= TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS) {
        // Already past 2 minutes, exit intent is ready
      } else {
        // Start timer for remaining time
        const remaining = TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS - elapsed;
        this.exitIntentTimer = setTimeout(() => {
          console.log('✅ Exit intent 2-minute timer completed');
        }, remaining);
      }
    }
  }
  
  private startInitialTimer(): void {
    if (!this.capabilities?.setTimeout) return;
    
    console.log('⏱️ Starting initial 10s timer for bumper system');
    this.initialTimer = setTimeout(() => {
      stateManager.recordInitialTimerComplete();
      console.log('✅ Initial 10s timer completed');
      
      // Check if we should trigger Product Bumper
      this.checkProductBumperTrigger();
    }, TIMING_CONSTANTS.INITIAL_TIMER_MS);
  }
  
  private setupEventListeners(): void {
    if (!this.capabilities?.addEventListener || typeof document === 'undefined') return;
    
    // Mouse movement tracking
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.handleMouseMove(e);
    };
    
    // Exit intent detection
    this.mouseLeaveHandler = (e: MouseEvent) => {
      this.handleMouseLeave(e);
    };
    
    // Tab visibility change
    this.visibilityChangeHandler = () => {
      this.handleVisibilityChange();
    };
    
    try {
      document.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
      document.addEventListener('mouseleave', this.mouseLeaveHandler);
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    } catch (error) {
      console.warn('Failed to setup event listeners:', error);
    }
  }
  
  private handleMouseMove(e: MouseEvent): void {
    this.lastMousePosition = { x: e.clientX, y: e.clientY };
    
    // Clear existing timeout
    if (this.mouseMoveTimeout) {
      clearTimeout(this.mouseMoveTimeout);
    }
    
    // Set new timeout to detect when mouse stops
    this.mouseMoveTimeout = setTimeout(() => {
      this.handleMouseStopped();
    }, 500); // 500ms of no movement = stopped
  }
  
  private handleMouseStopped(): void {
    stateManager.recordMouseStopped();
    
    // Start 3-second timer
    this.mouseStoppedTimer = setTimeout(() => {
      stateManager.recordMouseMovementTimerComplete();
      console.log('✅ Mouse movement 3s timer completed');
      
      // Check if we should trigger Product Bumper
      this.checkProductBumperTrigger();
    }, TIMING_CONSTANTS.MOUSE_MOVEMENT_TIMER_MS);
  }
  
  private handleMouseLeave(e: MouseEvent): void {
    // Only trigger on actual page leave (cursor near top edge)
    if (e.clientY <= 10) {
      this.checkExitIntentTrigger('mouse-leave');
    }
  }
  
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.checkExitIntentTrigger('tab-switch');
    }
  }
  
  private checkProductBumperTrigger(): void {
    if (!this.shouldShowProductBumper()) return;
    
    console.log('🎯 Triggering Product Bumper');
    this.callbacks.onProductBumperTrigger?.();
  }
  
  private checkExitIntentTrigger(triggerType: 'mouse-leave' | 'tab-switch'): void {
    if (!this.shouldShowExitIntentBumper()) return;
    
    console.log('🚪 Triggering Exit Intent Bumper:', triggerType);
    this.callbacks.onExitIntentBumperTrigger?.(triggerType);
  }
  
  shouldShowProductBumper(): boolean {
    const state = stateManager.getState();
    const now = Date.now();
    
    // Never show if already dismissed
    if (state.productBumperDismissed) return false;
    
    // Never show if already shown
    if (state.productBumperShown) return false;
    
    // Never show if user clicked into Guided Rankings
    if (state.hasClickedIntoGuidedRankings) return false;
    
    // Never show if any bumper is currently open
    if (state.isAnyBumperCurrentlyOpen) return false;
    
    // Never show if Guided Rankings is open
    if (state.isGuidedRankingsCurrentlyOpen) return false;
    
    // Never show if Comparison Report is open
    if (state.isComparisonReportCurrentlyOpen) return false;
    
    // Cross-bumper cooldown: if Exit-Intent was recently dismissed, wait 23s
    if (state.exitIntentDismissedAt) {
      const sinceExitDismiss = now - new Date(state.exitIntentDismissedAt).getTime();
      if (sinceExitDismiss < TIMING_CONSTANTS.POST_BUMPER_DELAY_MS) {
        return false;
      }
    }
    
    // Must have initial timer complete
    if (!state.initialTimerComplete) return false;
    
    // Must have mouse movement timer complete
    if (!state.mouseMovementTimerComplete) return false;
    
    // If user opened and closed Comparison Report, check timing
    if (state.comparisonReportClosedAt) {
      const sinceReportClosed = now - new Date(state.comparisonReportClosedAt).getTime();
      if (sinceReportClosed < TIMING_CONSTANTS.INITIAL_TIMER_MS) {
        return false;
      }
    }
    
    return true;
  }
  
  shouldShowExitIntentBumper(): boolean {
    const state = stateManager.getState();
    const now = Date.now();
    
    // Never show if already dismissed
    if (state.exitIntentDismissed) return false;
    
    // Never show if already shown
    if (state.exitIntentShown) return false;
    
    // Never show if user clicked into Guided Rankings
    if (state.hasClickedIntoGuidedRankings) return false;
    
    // Never show if any bumper is currently open
    if (state.isAnyBumperCurrentlyOpen) return false;
    
    // Never show if Guided Rankings is open
    if (state.isGuidedRankingsCurrentlyOpen) return false;
    
    // Never show if Comparison Report is open
    if (state.isComparisonReportCurrentlyOpen) return false;
    
    // If user opened and closed the Comparison Report, never show Exit-Intent
    if (state.comparisonReportClosedAt) return false;
    
    // Cross-bumper cooldown: if Product Bumper was recently dismissed, wait 23s
    if (state.productBumperDismissedAt) {
      const sinceProductDismiss = now - new Date(state.productBumperDismissedAt).getTime();
      if (sinceProductDismiss < TIMING_CONSTANTS.POST_BUMPER_DELAY_MS) {
        return false;
      }
    }
    
    // Must be at least 2 minutes since tool opened
    if (state.toolOpenedAt) {
      const timeSinceOpened = now - new Date(state.toolOpenedAt).getTime();
      if (timeSinceOpened < TIMING_CONSTANTS.EXIT_INTENT_TIMER_MS) {
        return false;
      }
    }
    
    return true;
  }
  
  // Manual trigger methods (for testing)
  triggerProductBumper(bypassRules = false): void {
    if (bypassRules || this.shouldShowProductBumper()) {
      console.log('🎯 Manually triggering Product Bumper');
      this.callbacks.onProductBumperTrigger?.();
    }
  }
  
  triggerExitIntentBumper(triggerType: 'mouse-leave' | 'tab-switch' = 'mouse-leave', bypassRules = false): void {
    if (bypassRules || this.shouldShowExitIntentBumper()) {
      console.log('🚪 Manually triggering Exit Intent Bumper');
      this.callbacks.onExitIntentBumperTrigger?.(triggerType);
    }
  }
  
  // Cleanup
  destroy(): void {
    // Clear timers
    if (this.initialTimer) clearTimeout(this.initialTimer);
    if (this.mouseStoppedTimer) clearTimeout(this.mouseStoppedTimer);
    if (this.exitIntentTimer) clearTimeout(this.exitIntentTimer);
    if (this.mouseMoveTimeout) clearTimeout(this.mouseMoveTimeout);
    
    // Remove event listeners
    if (typeof document !== 'undefined') {
      if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
      if (this.mouseLeaveHandler) document.removeEventListener('mouseleave', this.mouseLeaveHandler);
      if (this.visibilityChangeHandler) document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    this.initialized = false;
    this.hydrated = false;
  }
  
  // Status for debugging
  getStatus() {
    return {
      initialized: this.initialized,
      hydrated: this.hydrated,
      capabilities: this.capabilities,
      state: stateManager.getState(),
      shouldShowProduct: this.shouldShowProductBumper(),
      shouldShowExitIntent: this.shouldShowExitIntentBumper()
    };
  }
}

export const universalBumperEngine = UniversalBumperEngine.getInstance();
