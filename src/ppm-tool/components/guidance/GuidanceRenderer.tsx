/**
 * Presentation Layer - Pure UI Components
 * 
 * These components receive props and render consistently.
 * No environment detection, no business logic - just presentation.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface GuidanceRenderProps {
  // Content
  content: React.ReactNode;
  title?: string;
  
  // Positioning
  position: { top: number; left: number };
  placement?: 'top' | 'bottom' | 'left' | 'right';
  
  // Behavior
  isVisible: boolean;
  onClose?: () => void;
  onInteraction?: () => void;
  
  // Styling
  variant?: 'tooltip' | 'popover' | 'modal' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface GuidanceStrategy {
  usePortal: boolean;
  useAnimations: boolean;
  interactionMethod: 'hover' | 'click' | 'touch' | 'focus';
  renderingMode: 'full' | 'reduced' | 'minimal';
}

// ============================================================================
// PURE PRESENTATION COMPONENTS
// ============================================================================

/**
 * Basic tooltip renderer - no environment logic
 */
export function TooltipRenderer({ 
  content, 
  position, 
  isVisible, 
  onClose, 
  onInteraction,
  className,
  placement = 'top' 
}: GuidanceRenderProps) {
  if (!isVisible) return null;

  const tooltipContent = (
    <div
      className={cn(
        "fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg pointer-events-auto max-w-xs break-words",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={onInteraction}
      onMouseEnter={onInteraction}
    >
      {content}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-gray-300 hover:text-white"
          aria-label="Close tooltip"
        >
          ×
        </button>
      )}
    </div>
  );

  return tooltipContent;
}

/**
 * Popover renderer - no environment logic
 */
export function PopoverRenderer({ 
  content, 
  title,
  position, 
  isVisible, 
  onClose, 
  onInteraction,
  className,
  size = 'md' 
}: GuidanceRenderProps) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md',
  };

  const popoverContent = (
    <div
      className={cn(
        "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl pointer-events-auto",
        sizeClasses[size],
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={onInteraction}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close popover"
            >
              ×
            </button>
          )}
        </div>
      )}
      <div className="px-4 py-3 text-gray-700">
        {content}
      </div>
    </div>
  );

  return popoverContent;
}

/**
 * Modal renderer - no environment logic
 */
export function ModalRenderer({ 
  content, 
  title,
  isVisible, 
  onClose, 
  onInteraction,
  className,
  size = 'md' 
}: Omit<GuidanceRenderProps, 'position'>) {
  if (!isVisible) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "bg-white rounded-lg shadow-xl pointer-events-auto w-full",
            sizeClasses[size],
            className
          )}
          onClick={onInteraction}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close modal"
                >
                  ×
                </button>
              )}
            </div>
          )}
          <div className="px-6 py-4 text-gray-700">
            {content}
          </div>
        </div>
      </div>
    </>
  );

  return modalContent;
}

/**
 * Highlight renderer - no environment logic
 */
export function HighlightRenderer({ 
  content,
  position, 
  isVisible, 
  onClose, 
  onInteraction,
  className 
}: GuidanceRenderProps) {
  if (!isVisible) return null;

  const highlightContent = (
    <>
      {/* Highlight overlay */}
      <div
        className="fixed border-2 border-blue-500 bg-blue-500 bg-opacity-10 rounded-md pointer-events-none z-40"
        style={{
          top: `${position.top - 4}px`,
          left: `${position.left - 4}px`,
          width: '100px', // Would be calculated based on target element
          height: '40px', // Would be calculated based on target element
        }}
      />
      
      {/* Tooltip with content */}
      <div
        className={cn(
          "fixed z-50 px-3 py-2 text-sm bg-blue-600 text-white rounded-md shadow-lg pointer-events-auto max-w-xs break-words",
          className
        )}
        style={{
          top: `${position.top - 50}px`,
          left: `${position.left}px`,
        }}
        onClick={onInteraction}
      >
        {content}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-blue-200 hover:text-white"
            aria-label="Close highlight"
          >
            ×
          </button>
        )}
      </div>
    </>
  );

  return highlightContent;
}

// ============================================================================
// STRATEGY-AWARE RENDERER
// ============================================================================

/**
 * Main guidance renderer that adapts to strategy
 */
export function GuidanceRenderer({ 
  strategy,
  ...props 
}: GuidanceRenderProps & { strategy: GuidanceStrategy }) {
  const { variant = 'tooltip' } = props;

  // Choose renderer based on strategy
  const getRenderer = () => {
    if (strategy.renderingMode === 'minimal') {
      // Always use simple tooltip in minimal mode
      return <TooltipRenderer {...props} />;
    }

    switch (variant) {
      case 'popover':
        return <PopoverRenderer {...props} />;
      case 'modal':
        return <ModalRenderer {...props} />;
      case 'highlight':
        return <HighlightRenderer {...props} />;
      default:
        return <TooltipRenderer {...props} />;
    }
  };

  const renderer = getRenderer();

  // Apply portal strategy
  if (strategy.usePortal && typeof document !== 'undefined') {
    return createPortal(renderer, document.body);
  }

  // Apply animation strategy
  if (strategy.useAnimations) {
    return (
      <AnimatePresence>
        {props.isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {renderer}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return renderer;
}

// ============================================================================
// FALLBACK RENDERERS
// ============================================================================

/**
 * Minimal fallback renderer for constrained environments
 */
export function MinimalGuidanceRenderer({ 
  content, 
  isVisible, 
  onClose 
}: Pick<GuidanceRenderProps, 'content' | 'isVisible' | 'onClose'>) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg max-w-xs">
      {content}
      {onClose && (
        <button onClick={onClose} className="ml-2 text-blue-200 hover:text-white">
          ×
        </button>
      )}
    </div>
  );
}

/**
 * No-JS fallback renderer
 */
export function StaticGuidanceRenderer({ 
  content, 
  className 
}: Pick<GuidanceRenderProps, 'content' | 'className'>) {
  return (
    <div className={cn("p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800", className)}>
      {content}
    </div>
  );
}
