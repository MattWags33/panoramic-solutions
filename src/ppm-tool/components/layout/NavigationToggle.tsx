'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { ActionButtons } from './ActionButtons';
import type { Tool, Criterion } from '@/ppm-tool/shared/types';
import Image from 'next/image';

type NavigationStep = {
  id: string;
  label: string;
  description: string;
};

interface NavigationToggleProps {
  currentStep: string;
  onStepChange: (step: string) => void;
  compareCount?: number;
  selectedTools?: Tool[];
  selectedCriteria?: Criterion[];
  filteredTools?: Tool[];
  onAnimationTrigger?: () => void;
  onShowHowItWorks?: () => void;
  isProductBumperVisible?: boolean;
  getReportButtonRef?: React.RefObject<HTMLButtonElement>;
  onChartButtonPosition?: (position: { x: number; y: number }) => void;
  onCloseExitIntentBumper?: () => void;
}

export const NavigationToggle: React.FC<NavigationToggleProps> = ({
  currentStep,
  onStepChange,
  compareCount = 0,
  selectedTools = [],
  selectedCriteria = [],
  filteredTools = [],
  onAnimationTrigger,
  onShowHowItWorks,
  isProductBumperVisible = false,
  getReportButtonRef,
  onChartButtonPosition,
  onCloseExitIntentBumper
}) => {
  const isMobile = useMobileDetection();
  const [isChartGlowing, setIsChartGlowing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const chartButtonRef = useRef<HTMLButtonElement>(null);

  // Update chart button position when component mounts or layout changes
  const updateChartButtonPosition = useCallback(() => {
    if (chartButtonRef.current && onChartButtonPosition) {
      const rect = chartButtonRef.current.getBoundingClientRect();
      onChartButtonPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }
  }, [onChartButtonPosition]);

  // Calculate header height (fixed - no scroll changes)
  const getHeaderHeight = useCallback(() => {
    // Header uses py-2 but paddingTop style overrides the top portion
    // paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' = 12px top
    // py-2 = 8px bottom (top portion is overridden by style)
    // Logo height: h-8 (32px) on mobile, h-10 (40px) on desktop
    const topPadding = 12; // From style override: max(12px, env(safe-area-inset-top, 12px))
    const bottomPadding = isMobile ? 4 : 8; // Reduced bottom padding on mobile
    const logoHeight = isMobile ? 40 : 52; // h-8 = 32px, h-10 = 40px
    
    // Total header height: top padding + bottom padding + logo height
    return topPadding + bottomPadding + logoHeight;
  }, [isMobile]);

  // Calculate navigation height (fixed - no scroll changes)
  const getNavigationHeight = useCallback(() => {
    // Navigation uses different top padding for mobile vs desktop
    const topPadding = isMobile ? 8 : 8; // 8px on mobile to match bottom padding, keep 16px on desktop
    const bottomPadding = 8; // pb-2 = 8px (fixed)
    const contentHeight = 40; // Approximate content height
    
    // Add extra spacing below toggles on mobile for logo (original desktop logic)
    const mobileLogoSpacing = isMobile ? 8 : 0; // Extra space below toggles for mobile logo
    
    // Larger spacing between navigation and main content
    const extraSpacing = isMobile ? 28 : 8; // Increased mobile spacing for logo separation, keep desktop gap
    
    return topPadding + bottomPadding + contentHeight + mobileLogoSpacing + extraSpacing;
  }, [isMobile]);

  // Total combined height for content offset
  const getTotalFixedHeight = useCallback(() => {
    return getHeaderHeight() + getNavigationHeight();
  }, [getHeaderHeight, getNavigationHeight]);

  // Update position on mount and when compare count changes (affects button size) 
  useEffect(() => {
    updateChartButtonPosition();
  }, [updateChartButtonPosition, compareCount]);

  // Listen for animation triggers
  useEffect(() => {
    const handleAnimationTrigger = () => {
      // Only trigger if not already glowing to prevent double animations
      if (!isChartGlowing) {
        setIsChartGlowing(true);
        // Remove glow after 1.2 seconds to match CSS animation duration
        setTimeout(() => {
          setIsChartGlowing(false);
        }, 1200);
      }
    };

    // Listen for custom events from the animation
    if (typeof window !== 'undefined') {
      window.addEventListener('chartToggleGlow', handleAnimationTrigger);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chartToggleGlow', handleAnimationTrigger);
      }
    };
  }, [isChartGlowing]);

  // Set chart button position for animation
  useEffect(() => {
    if (chartButtonRef.current) {
      const rect = chartButtonRef.current.getBoundingClientRect();
      onChartButtonPosition?.({ x: rect.left, y: rect.top });
    }
  }, [onChartButtonPosition]);

  // Update CSS custom property when height changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const totalHeight = getTotalFixedHeight();
      document.documentElement.style.setProperty('--total-fixed-height', `${totalHeight}px`);
    }
  }, [isMobile, getTotalFixedHeight]); // Recalculate when mobile state changes

  // Handle resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const totalHeight = getTotalFixedHeight();
        document.documentElement.style.setProperty('--total-fixed-height', `${totalHeight}px`);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, getTotalFixedHeight]);

  // Handle scroll to show/hide shadow
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Show shadow when scrolled more than 10px to avoid flickering
      setIsScrolled(scrollTop > 10);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const steps: NavigationStep[] = isMobile 
    ? [
        { id: 'criteria', label: 'Rank Your Criteria', description: 'Set importance levels' },
        { id: 'tools', label: 'Tools & Recommendations', description: 'Choose PPM solutions' },
        { id: 'chart', label: 'Tool - Criteria Comparisons', description: 'Visual comparison' },
      ]
    : [
        { id: 'criteria-tools', label: 'Criteria + Tools', description: 'Set criteria & select tools' },
        { id: 'chart', label: 'Chart Comparison', description: 'Compare solutions' },
      ];

  return (
    <nav 
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        isProductBumperVisible && "blur-sm opacity-75",
        isScrolled && "shadow-md shadow-gray-300/70"
      )}
        style={{ 
          backgroundColor: '#F0F4FE',
          top: `${getHeaderHeight() + (isMobile ? 0 : 8)}px`, // Flush on mobile, more space on desktop
          '--total-fixed-height': `${getTotalFixedHeight() + (isMobile ? 0 : 8)}px` // Expose total height for content padding
        } as React.CSSProperties}
      aria-label="PPM Tool Navigation"
      role="navigation"
    >
      <div className={cn(
        "container mx-auto pb-2",
        isMobile ? "px-4 pt-4" : "px-4 pt-4" // Reduce from pt-8 to pt-4 on mobile for less spacing
      )}>
        <div className={cn(
          "flex items-center",
          isMobile ? "justify-center" : "justify-between"
        )}>
          {/* Navigation Steps - Left Side */}
          <div className={cn(
            "flex items-center",
            isMobile ? "w-full justify-center" : ""
          )}>
            {/* Simple Tab Navigation */}
            <div className={cn(
              "flex items-center relative",
              isMobile ? "space-x-0.5" : "space-x-6" // Reduced from space-x-2 to space-x-1 for mobile
            )}>
              {/* Continuous base line - mobile only */}
              {isMobile && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"></div>
              )}
              
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isChartStep = step.id === 'chart';
                const shouldGlow = isChartStep && isChartGlowing;
                return (
                    <button
                    key={step.id}
                    ref={isChartStep ? chartButtonRef : undefined}
                    onClick={() => onStepChange(step.id)}
                    className={cn(
                      'relative py-2 font-bold transition-all duration-300 flex flex-col items-center justify-end',
                      isMobile ? 'px-1 text-center h-14 flex-1' : 'px-1',
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-700',
                      shouldGlow && 'chart-toggle-glow'
                    )}
                  >
                    <span className={cn(
                      "text-center leading-tight",
                      isMobile ? "text-xs pb-1" : "text-sm md:text-base"
                    )}>
                      {step.id === 'criteria' ? (
                        <>
                          Rank Your<br />Criteria
                        </>
                      ) : (
                        step.label
                      )}
                    </span>
                    {isChartStep && compareCount > 0 && (
                      <div className={cn(
                        'absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full text-xs font-medium',
                        isActive ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'
                      )}>
                        {compareCount}
                      </div>
                    )}
                    {/* Active underline indicator */}
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300",
                      isActive 
                        ? "bg-blue-600" 
                        : isMobile 
                          ? "bg-transparent" 
                          : "bg-gray-300"
                    )} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* PPM Tool Logo - Center (Desktop only) */}
          {!isMobile && (
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center max-w-lg lg:max-w-xl">
              <div className="flex justify-center">
                <Image
                  src="/images/PPM_Tool_Finder.png"
                  alt="PPM Tool Finder"
                  width={250}
                  height={75}
                  className="h-10 md:h-14 lg:h-18 w-auto object-contain"
                  priority
                />
              </div>
            </div>
          )}
          
          {/* Action Buttons - Right Side (Desktop only) */}
          {!isMobile && (
            <ActionButtons 
              selectedTools={selectedTools} 
              selectedCriteria={selectedCriteria}
              filteredTools={filteredTools}
              onShowHowItWorks={onShowHowItWorks}
              getReportButtonRef={getReportButtonRef}
              onCloseExitIntentBumper={onCloseExitIntentBumper}
            />
          )}
                 </div>
       </div>
     </nav>
  );
}; 
