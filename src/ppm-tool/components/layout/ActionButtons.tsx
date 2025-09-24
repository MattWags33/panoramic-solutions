'use client';

import React, { useState } from 'react';
import { Send, HelpCircle } from 'lucide-react';
import { useMobileDetection } from '@/ppm-tool/shared/hooks/useMobileDetection';
import { cn } from '@/ppm-tool/shared/lib/utils';
import { EmailCaptureModal } from '@/ppm-tool/components/forms/EmailCaptureModal';
import { useGuidance } from '@/ppm-tool/shared/contexts/GuidanceContext';
// REMOVED: PDF generation functionality - now focuses on email reports only
import type { Tool, Criterion } from '@/ppm-tool/shared/types';

interface ActionButtonsProps {
  selectedTools?: Tool[];
  selectedCriteria?: Criterion[];
  filteredTools?: Tool[];
  onShowHowItWorks?: () => void;
  getReportButtonRef?: React.RefObject<HTMLButtonElement>;
  onCloseExitIntentBumper?: () => void;
}

// 3D Tower Loader Component (smaller version for buttons)
const TowerLoader: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`tower-loader ${className}`}>
      <style jsx>{`
        .tower-loader {
          height: 12px;
          width: 10px;
          position: relative;
          display: inline-block;
        }

        .tower-box {
          position: relative;
          opacity: 0;
          left: 2px;
        }

        .side-left {
          position: absolute;
          background-color: #87CEEB;
          width: 5px;
          height: 1.5px;
          transform: skew(0deg, -25deg);
          top: 4px;
          left: 3px;
        }

        .side-right {
          position: absolute;
          background-color: #5DADE2;
          width: 5px;
          height: 1.5px;
          transform: skew(0deg, 25deg);
          top: 4px;
          left: -2px;
        }

        .side-top {
          position: absolute;
          background-color: #AED6F1;
          width: 5px;
          height: 5px;
          rotate: 45deg;
          transform: skew(-20deg, -20deg);
        }

        .tower-box-1 {
          animation: from-left 4s infinite;
        }

        .tower-box-2 {
          animation: from-right 4s infinite;
          animation-delay: 1s;
        }

        .tower-box-3 {
          animation: from-left 4s infinite;
          animation-delay: 2s;
        }

        .tower-box-4 {
          animation: from-right 4s infinite;
          animation-delay: 3s;
        }

        @keyframes from-left {
          0% {
            z-index: 20;
            opacity: 0;
            translate: -5px -1.5px;
          }
          20% {
            z-index: 10;
            opacity: 1;
            translate: 0px 0px;
          }
          40% {
            z-index: 9;
            translate: 0px 1px;
          }
          60% {
            z-index: 8;
            translate: 0px 2px;
          }
          80% {
            z-index: 7;
            opacity: 1;
            translate: 0px 3px;
          }
          100% {
            z-index: 5;
            translate: 0px 8px;
            opacity: 0;
          }
        }

        @keyframes from-right {
          0% {
            z-index: 20;
            opacity: 0;
            translate: 5px -1.5px;
          }
          20% {
            z-index: 10;
            opacity: 1;
            translate: 0px 0px;
          }
          40% {
            z-index: 9;
            translate: 0px 1px;
          }
          60% {
            z-index: 8;
            translate: 0px 2px;
          }
          80% {
            z-index: 7;
            opacity: 1;
            translate: 0px 3px;
          }
          100% {
            z-index: 5;
            translate: 0px 8px;
            opacity: 0;
          }
        }
      `}</style>
      
      <div className="tower-box tower-box-1">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-2">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-3">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
      <div className="tower-box tower-box-4">
        <div className="side-left"></div>
        <div className="side-right"></div>
        <div className="side-top"></div>
      </div>
    </div>
  );
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  selectedTools = [], 
  selectedCriteria = [],
  filteredTools = [],
  onShowHowItWorks,
  getReportButtonRef,
  onCloseExitIntentBumper
}) => {
  const isMobile = useMobileDetection();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { onComparisonReportClick, onComparisonReportOpen, onComparisonReportClose } = useGuidance();
  
  const handleGetReport = () => {
    // Record that user clicked into Comparison Report
    onComparisonReportClick();
    onComparisonReportOpen();
    // Dismiss exit intent bumper when user clicks the report button
    onCloseExitIntentBumper?.();
    setShowEmailModal(true);
  };

  const handleEmailSubmit = async (email: string, firstName: string, lastName: string) => {
    try {
      setIsProcessing(true);
      
      // TODO: Send email report via API instead of PDF generation
      // await sendEmailReport(email, firstName, lastName, selectedTools, selectedCriteria);
      
      console.log('Email report request for:', email);
      console.log('Name:', firstName, lastName);
      console.log('Tools:', selectedTools.length);
      console.log('Criteria:', selectedCriteria.length);
      
      // Close modal after successful submission
      onComparisonReportClose();
      setShowEmailModal(false);
    } catch (error) {
      console.error('Error sending email report:', error);
      // Keep modal open so user can try again
    } finally {
      setIsProcessing(false);
    }
  };

  // Mobile version - fixed bottom bar
  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Safe area padding for modern mobile devices */}
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg p-3 pb-safe">
            <div className="flex gap-2 justify-center max-w-lg mx-auto">
              {/* How It Works Button - Blue (Mobile) */}
              {onShowHowItWorks && (
                <button
                  onClick={onShowHowItWorks}
                  className={cn(
                    "flex-1 bg-blue-400 text-white px-3 py-3 rounded-xl font-medium text-sm",
                    "flex items-center justify-center gap-2",
                    "active:scale-95 transition-transform",
                    "shadow-sm active:shadow-inner hover:bg-blue-500"
                  )}
                >
                  <HelpCircle className="w-4 h-4" />
                  How It Works
                </button>
              )}
              {/* Get Report Button - Blue (Mobile) */}
              <button
                ref={getReportButtonRef}
                onClick={handleGetReport}
                className={cn(
                  `${onShowHowItWorks ? 'flex-1' : 'w-full'} bg-blue-400 text-white px-4 py-3 rounded-xl font-medium text-sm`,
                  "flex items-center justify-center gap-2", 
                  "active:scale-95 transition-transform",
                  "shadow-sm active:shadow-inner hover:bg-blue-500"
                )}
              >
                <Send className="w-4 h-4" />
                Get My Free Comparison Report
              </button>
            </div>
          </div>
        </div>

        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={() => {
            onComparisonReportClose();
            setShowEmailModal(false);
          }}
          onSubmit={handleEmailSubmit}
          isLoading={isProcessing}
          selectedTools={filteredTools.length > 0 ? filteredTools : selectedTools}
          selectedCriteria={selectedCriteria}
        />
      </>
    );
  }

  // Desktop version - inline buttons
  return (
    <>
      <div className="flex items-center justify-center gap-6">
        {/* How It Works - Plain Text */}
        {onShowHowItWorks && (
          <button
            onClick={onShowHowItWorks}
            className="text-alpine-blue-400 text-xs md:text-sm font-medium flex items-center gap-2 hover:text-alpine-blue-500 transition-colors mr-2"
          >
            <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">How It Works</span>
            <span className="sm:hidden">How It Works</span>
          </button>
        )}
        
        <button
          ref={getReportButtonRef}
          onClick={handleGetReport}
          className="bg-alpine-blue-400 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium flex items-center gap-2 hover:bg-alpine-blue-500 transition-colors"
        >
          <Send className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Get my Free Comparison Report</span>
          <span className="sm:hidden">Get Report</span>
        </button>
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => {
          onComparisonReportClose();
          setShowEmailModal(false);
        }}
        onSubmit={handleEmailSubmit}
        isLoading={isProcessing}
        selectedTools={filteredTools.length > 0 ? filteredTools : selectedTools}
        selectedCriteria={selectedCriteria}
      />
    </>
  );
}; 