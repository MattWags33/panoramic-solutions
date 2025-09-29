/**
 * Universal Guidance System - Orchestration Layer
 * 
 * Combines business logic, environment detection, and presentation
 * to provide consistent guidance across all environments.
 */

import React, { useCallback, useEffect } from 'react';
import { useGuidanceState, useGuidanceSelectors } from '@/ppm-tool/shared/hooks/useGuidanceState';
import { 
  useEnvironmentCapabilities, 
  useEnvironmentStrategy, 
  useEnvironmentRenderer,
  useSafeStorage 
} from '@/ppm-tool/shared/services/environmentCapabilities';
import { 
  GuidanceRenderer, 
  MinimalGuidanceRenderer, 
  StaticGuidanceRenderer,
  type GuidanceRenderProps 
} from './GuidanceRenderer';

// ============================================================================
// UNIVERSAL GUIDANCE HOOK
// ============================================================================

export interface UniversalGuidanceConfig {
  guidanceId: string;
  content: React.ReactNode;
  title?: string;
  variant?: 'tooltip' | 'popover' | 'modal' | 'highlight';
  trigger?: 'user-action' | 'user-intent' | 'user-progress';
  targetElement?: HTMLElement | null;
  position?: { top: number; left: number };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Main hook that orchestrates the entire guidance system
 */
export function useUniversalGuidance(config: UniversalGuidanceConfig) {
  const [guidanceState, guidanceActions] = useGuidanceState();
  const selectors = useGuidanceSelectors(guidanceState);
  const capabilities = useEnvironmentCapabilities();
  const strategy = useEnvironmentStrategy(capabilities);
  const renderer = useEnvironmentRenderer(capabilities);
  const { storage } = useSafeStorage(capabilities);

  // Determine if this guidance should be shown
  const shouldShow = useCallback(() => {
    // Don't show if guidance is disabled
    if (!selectors.canShowGuidance) return false;
    
    // Don't show if this specific guidance is active
    if (guidanceState.activeGuidance !== config.guidanceId) return false;
    
    // Don't show if environment can't render it
    if (!renderer.shouldRender) return false;
    
    // Show based on trigger type
    switch (config.trigger) {
      case 'user-progress':
        return selectors.shouldShowProgressGuidance;
      case 'user-intent':
        return selectors.shouldShowHelpGuidance;
      case 'user-action':
      default:
        return true;
    }
  }, [
    selectors,
    guidanceState.activeGuidance,
    config.guidanceId,
    config.trigger,
    renderer.shouldRender
  ]);

  // Show guidance
  const showGuidance = useCallback(() => {
    if (config.trigger) {
      guidanceActions.showGuidance(config.guidanceId, config.trigger);
    }
  }, [guidanceActions, config.guidanceId, config.trigger]);

  // Hide guidance
  const hideGuidance = useCallback(() => {
    guidanceActions.hideGuidance(config.guidanceId);
  }, [guidanceActions, config.guidanceId]);

  // Record interaction
  const recordInteraction = useCallback(() => {
    guidanceActions.recordInteraction(config.guidanceId);
  }, [guidanceActions, config.guidanceId]);

  // Calculate position from target element
  const calculatePosition = useCallback((): { top: number; left: number } => {
    if (config.position) return config.position;
    
    if (config.targetElement && typeof window !== 'undefined') {
      const rect = config.targetElement.getBoundingClientRect();
      return {
        top: rect.bottom + 8,
        left: rect.left,
      };
    }
    
    // Fallback position
    return { top: 100, left: 100 };
  }, [config.position, config.targetElement]);

  return {
    // State
    isVisible: shouldShow(),
    capabilities,
    strategy,
    
    // Actions
    show: showGuidance,
    hide: hideGuidance,
    recordInteraction,
    
    // Render props
    renderProps: {
      content: config.content,
      title: config.title,
      position: calculatePosition(),
      isVisible: shouldShow(),
      onClose: hideGuidance,
      onInteraction: recordInteraction,
      variant: config.variant || 'tooltip',
      size: config.size || 'md',
      className: config.className,
      strategy: {
        usePortal: renderer.shouldUsePortal,
        useAnimations: !strategy.useReducedAnimations,
        interactionMethod: strategy.interactionMethod,
        renderingMode: strategy.fallbackLevel,
      },
    } as GuidanceRenderProps & { strategy: any },
  };
}

// ============================================================================
// UNIVERSAL GUIDANCE COMPONENT
// ============================================================================

export interface UniversalGuidanceProps extends UniversalGuidanceConfig {
  // Additional props for direct component usage
  isVisible?: boolean;
  onShow?: () => void;
  onHide?: () => void;
}

/**
 * Universal guidance component that works in all environments
 */
export function UniversalGuidance(props: UniversalGuidanceProps) {
  const guidance = useUniversalGuidance(props);

  // Handle external visibility control
  useEffect(() => {
    if (props.isVisible !== undefined) {
      if (props.isVisible && !guidance.isVisible) {
        guidance.show();
        props.onShow?.();
      } else if (!props.isVisible && guidance.isVisible) {
        guidance.hide();
        props.onHide?.();
      }
    }
  }, [props.isVisible, guidance.isVisible, guidance.show, guidance.hide, props.onShow, props.onHide]);

  // Choose appropriate renderer based on capabilities
  if (!guidance.capabilities.supportsPortals || guidance.capabilities.isLowEndDevice) {
    return <MinimalGuidanceRenderer {...guidance.renderProps} />;
  }

  if (guidance.capabilities.isSSR) {
    return <StaticGuidanceRenderer {...guidance.renderProps} />;
  }

  return <GuidanceRenderer {...guidance.renderProps} />;
}

// ============================================================================
// SPECIALIZED GUIDANCE COMPONENTS
// ============================================================================

/**
 * Tooltip guidance with user-centric triggers
 */
export function UniversalTooltip({ 
  children, 
  content, 
  trigger = 'user-action',
  ...props 
}: UniversalGuidanceProps & { children: React.ReactNode }) {
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const guidance = useUniversalGuidance({
    ...props,
    content,
    variant: 'tooltip',
    trigger,
    targetElement,
  });

  const handleMouseEnter = useCallback(() => {
    if (guidance.strategy.interactionMethod === 'hover') {
      guidance.show();
    }
  }, [guidance]);

  const handleClick = useCallback(() => {
    if (guidance.strategy.interactionMethod === 'click' || guidance.strategy.interactionMethod === 'touch') {
      guidance.show();
    }
  }, [guidance]);

  const handleFocus = useCallback(() => {
    if (guidance.strategy.interactionMethod === 'focus') {
      guidance.show();
    }
  }, [guidance]);

  return (
    <>
      <div
        ref={setTargetElement}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={guidance.hide}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={guidance.hide}
      >
        {children}
      </div>
      <UniversalGuidance {...props} content={content} targetElement={targetElement} />
    </>
  );
}

/**
 * Progress-based guidance that shows based on user progress
 */
export function ProgressGuidance(props: Omit<UniversalGuidanceProps, 'trigger'>) {
  return <UniversalGuidance {...props} trigger="user-progress" />;
}

/**
 * Help guidance that shows when user seems stuck
 */
export function HelpGuidance(props: Omit<UniversalGuidanceProps, 'trigger'>) {
  return <UniversalGuidance {...props} trigger="user-intent" />;
}

// ============================================================================
// GUIDANCE SYSTEM PROVIDER
// ============================================================================

/**
 * Provider that initializes the guidance system
 */
export function GuidanceSystemProvider({ children }: { children: React.ReactNode }) {
  const [guidanceState, guidanceActions] = useGuidanceState();
  const capabilities = useEnvironmentCapabilities();

  // Initialize system based on capabilities
  useEffect(() => {
    // Set preferences based on environment
    if (capabilities.isLowEndDevice || capabilities.isCorporateNetwork) {
      guidanceActions.setGuidancePreference(true); // Prefer minimal guidance
    }
  }, [capabilities, guidanceActions]);

  return (
    <div data-guidance-system="initialized">
      {children}
    </div>
  );
}
