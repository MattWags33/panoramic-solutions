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
    
    document.addEventListener('click', handleClickOutside);
    // Only auto-close on true mobile devices, not touch-enabled laptops
    const timer = isTouchDevice ? setTimeout(() => setIsOpen(false), 4000) : null;
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (timer) clearTimeout(timer);
    };
  }, [effectiveIsOpen, isTouchDevice, hasTouch, forceOpen, handleClickOutside]);

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

    // Viewport boundary checking
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
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
          style={{ touchAction: 'manipulation' }}
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
          style={{ touchAction: 'manipulation' }}
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
