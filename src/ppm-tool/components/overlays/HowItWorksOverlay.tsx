'use client';

import React, { useEffect } from 'react';
import { ArrowRight, X, Zap, Users, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/ppm-tool/components/ui/button';
import { checkAndTrackNewActive } from '@/lib/posthog';

interface HowItWorksOverlayProps {
  isVisible: boolean;
  onClose?: () => void;
  onGetStarted: () => void;
  onManualRanking: () => void;
}

const step1Criteria = [
  "Scalability",
  "Integrations & Extensibility", 
  "Ease of Use",
  "Flexibility & Customization",
  "Reporting & Analytics",
  "Security & Compliance",
  "Portfolio Management"
];

const remainingSteps = [
  {
    number: "02",
    title: "Analyze Tools and Recommendations",
    items: [
      "Explore and evaluate tools that are a best match for you.",
    ]
  },
  {
    number: "03",
    title: "Compare Results",
    items: [
      "Use the interactive chart for further comparisons.",
    ]
  },
  {
    number: "04", 
    title: "Get My Free Comparison Report",
    items: [
      "We'll send a clean, easy-to-read version of your results, rankings, and recommendations to your inbox.",
    ]
  }
];

const featureCards = [
  {
    icon: <Zap className="w-4 h-4 text-blue-600" />,
    title: "Instant Intelligence",
    description: "Get recommendations in minutes, not months"
  },
  {
    icon: <Users className="w-4 h-4 text-blue-600" />,
    title: "Proven Methodology",
    description: "Designed using real-world implementations across industries"
  },
  {
    icon: <Target className="w-4 h-4 text-blue-600" />,
    title: "Tailored Results",
    description: "Recommendations specific to your organization's needs"
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    title: "Start on Course",
    description: "Leverage our deep research and avoid costly tool selection mistakes"
  }
];

export const HowItWorksOverlay: React.FC<HowItWorksOverlayProps> = ({
  isVisible,
  onClose,
  onGetStarted,
  onManualRanking
}) => {


  // Handle body scroll and mobile compatibility
  useEffect(() => {
    if (isVisible && typeof window !== 'undefined') {
      // Store original scroll position and prevent body scroll
      const scrollY = window.scrollY;
      const body = document.body;
      const html = document.documentElement;
      
      // Store original styles
      const originalBodyStyle = {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        overflow: body.style.overflow,
        width: body.style.width,
        height: body.style.height
      };
      
      // Apply styles to prevent background scroll
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';
      body.style.width = '100%';
      body.style.height = '100%';
      
      return () => {
        // Restore original styles
        Object.keys(originalBodyStyle).forEach(key => {
          body.style[key as any] = originalBodyStyle[key as keyof typeof originalBodyStyle];
        });
        
        // Restore scroll position
        html.scrollTop = scrollY;
        body.scrollTop = scrollY;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="absolute inset-4 flex items-center justify-center pointer-events-none"
      >
        <div 
          className="bg-white rounded-xl shadow-xl w-full max-w-sm md:max-w-4xl lg:max-w-6xl h-[85vh] md:h-[90vh] lg:h-[85vh] overflow-hidden pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - Top Right */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
              aria-label="Close How It Works"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
          
          {/* Scrollable content */}
          <div 
            className="h-full overflow-y-auto"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollBehavior: 'smooth'
            }}
            onWheel={(e) => {
              // Ensure wheel events work properly
              e.stopPropagation();
            }}
          >
            <div className="p-3 md:p-6 lg:p-8">
              {/* Header */}
              <div className="relative text-center mb-4 pr-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
              
              {/* Value Statement - Hidden on Mobile */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 hidden md:block">
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  Get 100% free personalized recommendations in minutes with our intelligent Project Portfolio Management Tool assessment. Make informed decisions and focus on key features identified through deep research for lasting project portfolio success.
                </p>
              </div>
            </div>

            {/* Feature Cards Section - Hidden on Mobile */}
            <div className="mb-6 hidden md:block">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {featureCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-3"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-2 p-2 bg-blue-50 rounded-full">
                        {card.icon}
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs md:text-sm mb-1">{card.title}</h4>
                      <p className="text-xs text-gray-600 leading-tight">{card.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main layout: Step 1 card with integrated button */}
            <div className="mb-6">
              {/* Step 1: Rank Your Criteria - Main Card with Button */}
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg border border-blue-200 relative overflow-visible">
                <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-lg z-20">
                  01
                </div>
                <div className="pt-6 md:pt-7 px-4 md:px-6 pb-4 md:pb-6">
                  <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3">Rank Your Criteria</h3>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mb-4 rounded-full"></div>
                  
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="flex-1 text-sm text-gray-700">
                      <p className="text-sm md:text-base mb-4 text-gray-600 leading-relaxed">
                        Our guided method ensures your rankings follow the same research-backed framework we use to evaluate tools.
                      </p>
                      <p className="font-semibold mb-3 text-sm md:text-base text-gray-900">Criteria That Is Analyzed:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                        {step1Criteria.map((criterion, index) => (
                          <div key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 flex-shrink-0"></span>
                            <span className="text-sm md:text-base text-gray-700">{criterion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* CTA Button - positioned to the right on desktop, below on mobile */}
                    <div className="flex justify-center lg:items-center mt-4 lg:mt-0">
                      <button
                        onClick={() => {
                          // Track how it works interaction for New_Active metric
                          try {
                            checkAndTrackNewActive('Active-how-it-works', {
                              component: 'how_it_works_overlay',
                              interaction_type: 'rank_criteria_clicked',
                              overlay_step: 'step_1'
                            });
                          } catch (error) {
                            console.warn('Failed to track how it works interaction:', error);
                          }
                          
                          onGetStarted();
                        }}
                        className="flex flex-col items-center px-6 py-4 text-sm md:text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <span>Rank Your Criteria</span>
                        <div className="flex items-center mt-1">
                          <span className="text-xs md:text-sm opacity-90">Question 1</span>
                          <ArrowRight className="ml-1 w-3 h-3 md:w-4 md:h-4" />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom cards - responsive grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {remainingSteps.map((step, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 relative overflow-visible">
                  <div className="absolute -top-2 -left-2 md:-top-3 md:-left-3 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-lg z-20">
                    {step.number}
                  </div>
                  <div className="pt-6 md:pt-7 px-4 md:px-5 pb-4 md:pb-5">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3">{step.title}</h3>
                    <div className={`w-10 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full ${step.number === "03" ? "mb-4" : "mb-3"}`}></div>
                    <div className="text-xs md:text-sm text-gray-700 leading-relaxed">
                      {step.items.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 