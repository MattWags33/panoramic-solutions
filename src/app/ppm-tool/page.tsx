'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/ppm-tool/components/common/ErrorBoundary';
import { EmbeddedPPMToolFlow } from '@/ppm-tool/components/common/EmbeddedPPMToolFlow';
import { GuidanceProvider } from '@/ppm-tool/shared/contexts/GuidanceContext';
import { UniversalBumperProvider } from '@/ppm-tool/components/UniversalBumperProvider';
import { HowItWorksOverlay } from '@/ppm-tool/components/overlays/HowItWorksOverlay';
import { usePostHog } from '@/hooks/usePostHog';
import { setOverlayOpen, setOverlayClosed, OVERLAY_TYPES, addDevelopmentKeyboardShortcuts } from '@/ppm-tool/shared/utils/homeState';
import { LegalDisclaimer } from '@/ppm-tool/components/common/LegalDisclaimer';

export default function PPMToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showGuidedRanking, setShowGuidedRanking] = useState(false);
  const guidedButtonRef = useRef<HTMLButtonElement>(null);
  const { trackClick, trackTool, checkAndTrackVisitor, checkAndTrackActive } = usePostHog();
  
  // Note: Bumper management is handled internally by EmbeddedPPMToolFlow
  // No need for duplicate state management at this level

  // Check URL parameters on mount and when they change
  useEffect(() => {
    const overlay = searchParams?.get('overlay');
    if (overlay === 'how-it-works') {
      setShowHowItWorks(true);
      setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);
    }
  }, [searchParams]);

  // Track new visitor and active user on page load
  useEffect(() => {
    // Check and track new visitor
    checkAndTrackVisitor({
      page: 'ppm_tool',
      tool_type: 'portfolio_management'
    });

    // Track first interaction as active user
    const handleFirstInteraction = () => {
      checkAndTrackActive('page_interaction', {
        page: 'ppm_tool',
        interaction_type: 'page_load'
      });
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('scroll', handleFirstInteraction);

    // Add development keyboard shortcuts for home state testing
    addDevelopmentKeyboardShortcuts();

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };
  }, [checkAndTrackVisitor, checkAndTrackActive]);

  const handleGetStarted = () => {
    trackClick('get_started_button', { location: 'how_it_works_overlay' });
    trackTool('ppm_tool', 'started_guided_flow', { source: 'how_it_works' });
    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    setShowGuidedRanking(true); // Directly open guided ranking
  };

  const handleManualRanking = () => {
    trackClick('manual_ranking_button', { location: 'how_it_works_overlay' });
    trackTool('ppm_tool', 'started_manual_flow', { source: 'how_it_works' });
    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    // Go directly to manual tool selection
  };

  const handleGuidedRankingComplete = () => {
    trackTool('ppm_tool', 'guided_ranking_completed', { 
      source: 'guided_flow',
      completion_time: Date.now()
    });
    setShowGuidedRanking(false);
  };

  const handleOpenGuidedRanking = () => {
    trackClick('open_guided_ranking', { location: 'main_page' });
    trackTool('ppm_tool', 'opened_guided_ranking', { source: 'main_page' });
    setShowGuidedRanking(true);
  };

  const handleShowHowItWorks = () => {
    trackClick('show_how_it_works', { location: 'main_page' });
    trackTool('ppm_tool', 'viewed_how_it_works', { source: 'main_page' });
    setShowHowItWorks(true);
    setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('overlay', 'how-it-works');
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseHowItWorks = () => {
    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    
    // Remove overlay parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('overlay');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <ErrorBoundary>
      <GuidanceProvider>
        <UniversalBumperProvider>
          <div className="min-h-screen bg-background ppm-tool-container" role="main">
              <EmbeddedPPMToolFlow 
                showGuidedRanking={showGuidedRanking}
                onGuidedRankingComplete={handleGuidedRankingComplete}
                onOpenGuidedRanking={handleOpenGuidedRanking}
                onShowHowItWorks={handleShowHowItWorks}
                guidedButtonRef={guidedButtonRef}
              />
              
              {/* How It Works Overlay - triggered manually via button or URL parameter */}
              <HowItWorksOverlay
                isVisible={showHowItWorks}
                onClose={handleCloseHowItWorks}
                onGetStarted={handleGetStarted}
                onManualRanking={handleManualRanking}
              />

              {/* Note: ProductBumper and ExitIntentBumper are now managed internally by EmbeddedPPMToolFlow */}
              {/* This ensures proper access to all required props like toolCount, hasFilters, and emailButtonRef */}

              {/* Legal Disclaimer - Inside the PPM tool container */}
              <div className="container mx-auto px-4 pb-6">
                <LegalDisclaimer />
              </div>
          </div>
        </UniversalBumperProvider>
      </GuidanceProvider>
    </ErrorBoundary>
  );
}
