import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection';
import { BasicHoverTooltip } from './basic-hover-tooltip';

interface MobileTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  className?: string;
  forceOpen?: boolean; // New prop for external control
  disableClickInterception?: boolean; // Disable click event interception for nested interactive elements
}

/**
 * Hybrid tooltip that automatically chooses the right behavior:
 * - Desktop: Hover-based tooltip using BasicHoverTooltip
 * - Mobile/Touch: Touch-based tooltip with click activation
 * - External control: Can be forced open via forceOpen prop
 */
export const MobileTooltip: React.FC<MobileTooltipProps> = ({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  forceOpen = false,
  disableClickInterception = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isTouchDevice, hasTouch } = useUnifiedMobileDetection();

  // External control: forceOpen overrides internal state
  const effectiveIsOpen = forceOpen || isOpen;

  const handleClick = (e: React.MouseEvent) => {
    if (disableClickInterception) return; // Don't intercept clicks when disabled (for nested interactive elements)
    if (forceOpen) return; // Don't handle clicks when externally controlled
    // Handle clicks for mobile devices and touch-enabled laptops
    if (isTouchDevice || hasTouch) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    }
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (forceOpen) return; // Don't handle outside clicks when externally controlled
    if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, [forceOpen]);

  useEffect(() => {
    if ((!isTouchDevice && !hasTouch) || !effectiveIsOpen || forceOpen) return;
    
    // ROBUST SOLUTION: Multi-layered approach to prevent opening click from triggering close
    // LAYER 1: Track if this is the opening click
    let isOpeningClick = true;
    
    // LAYER 2: Enhanced click handler that respects the opening click
    const enhancedClickOutside = (e: MouseEvent) => {
      // Ignore the click that just opened the tooltip
      if (isOpeningClick) {
        isOpeningClick = false;
        return;
      }
      
      // Standard click-outside logic
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    // LAYER 3: Attach listener with double RAF to ensure click has fully propagated
    // This syncs with browser paint cycle for maximum reliability
    let rafId1: number;
    let rafId2: number;
    
    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        // Use capture phase to catch events early
        document.addEventListener('click', enhancedClickOutside, { capture: true });
      });
    });
    
    // Only auto-close on true mobile devices, not touch-enabled laptops
    const autoCloseTimer = isTouchDevice ? setTimeout(() => setIsOpen(false), 4000) : null;
    
    return () => {
      cancelAnimationFrame(rafId1);
      cancelAnimationFrame(rafId2);
      document.removeEventListener('click', enhancedClickOutside, { capture: true });
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [effectiveIsOpen, isTouchDevice, hasTouch, forceOpen]);

  useEffect(() => {
    if ((!isTouchDevice && !hasTouch) || !effectiveIsOpen || !triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        switch (align) {
          case 'start':
            left = triggerRect.left;
            break;
          case 'center':
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
          case 'end':
            left = triggerRect.right - tooltipRect.width;
            break;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        switch (align) {
          case 'start':
            left = triggerRect.left;
            break;
          case 'center':
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
          case 'end':
            left = triggerRect.right - tooltipRect.width;
            break;
        }
        break;
      case 'left':
        left = triggerRect.left - tooltipRect.width - 8;
        switch (align) {
          case 'start':
            top = triggerRect.top;
            break;
          case 'center':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            break;
          case 'end':
            top = triggerRect.bottom - tooltipRect.height;
            break;
        }
        break;
      case 'right':
        left = triggerRect.right + 8;
        switch (align) {
          case 'start':
            top = triggerRect.top;
            break;
          case 'center':
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            break;
          case 'end':
            top = triggerRect.bottom - tooltipRect.height;
            break;
        }
        break;
    }

    // Viewport boundary checking with aggressive centering
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Horizontal positioning: always try to center if possible
    if (align === 'center') {
      // Check if tooltip fits when centered
      const centeredLeft = (viewportWidth - tooltipRect.width) / 2;
      if (centeredLeft >= padding && centeredLeft + tooltipRect.width <= viewportWidth - padding) {
        left = centeredLeft;
      } else {
        // Fallback to calculated position with boundary checks
        if (left < padding) left = padding;
        if (left + tooltipRect.width > viewportWidth - padding) {
          left = viewportWidth - tooltipRect.width - padding;
        }
      }
    } else {
      // Non-centered: standard boundary checks
      if (left < padding) left = padding;
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
      }
    }

    // Vertical positioning: ensure tooltip is always visible
    if (top < padding) {
      // If tooltip would go above viewport, position it below trigger instead
      if (side === 'top') {
        top = triggerRect.bottom + 8;
      } else {
        top = padding;
      }
    } else if (top + tooltipRect.height > viewportHeight - padding) {
      // If tooltip would go below viewport, position it above trigger instead
      if (side === 'bottom') {
        top = triggerRect.top - tooltipRect.height - 8;
      } else {
        top = viewportHeight - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
  }, [effectiveIsOpen, side, align, isTouchDevice, hasTouch]);

  // Three device types with different behaviors:
  if (isTouchDevice) {
    // Mobile phones/tablets: Click-only tooltip (UNCHANGED)
    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleClick}
          className="inline-block cursor-pointer"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: disableClickInterception ? 'none' : 'auto'
          }}
        >
          {children}
        </div>
        
        {effectiveIsOpen && (
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg pointer-events-auto max-w-xs break-words ${className}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {content}
          </div>
        )}
      </>
    );
  } else if (hasTouch) {
    // Touch-enabled laptops: Hybrid hover+click tooltip (NEW)
    return (
      <>
        <div
          ref={triggerRef}
          onClick={handleClick}
          className="inline-block cursor-pointer"
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: disableClickInterception ? 'none' : 'auto'
          }}
        >
          <BasicHoverTooltip
            content={content}
            side={side}
            align={align}
            className={className}
            forceOpen={forceOpen}
          >
            {children}
          </BasicHoverTooltip>
        </div>
        
        {effectiveIsOpen && (
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg pointer-events-auto max-w-xs break-words ${className}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {content}
          </div>
        )}
      </>
    );
  } else {
    // Desktop-only: Hover tooltip (UNCHANGED)
    return (
      <BasicHoverTooltip
        content={content}
        side={side}
        align={align}
        className={className}
        forceOpen={forceOpen}
      >
        {children}
      </BasicHoverTooltip>
    );
  }
};
