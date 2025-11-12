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
import { analytics } from '@/lib/analytics';

export default function PPMToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showGuidedRanking, setShowGuidedRanking] = useState(false);
  const [guidedRankingCriterionId, setGuidedRankingCriterionId] = useState<string | undefined>(undefined);
  const [initialView, setInitialView] = useState<string | undefined>(undefined);
  const guidedButtonRef = useRef<HTMLButtonElement>(null);
  const { trackClick, trackTool, checkAndTrackVisitor, checkAndTrackActive } = usePostHog();
  
  // Note: Bumper management is handled internally by EmbeddedPPMToolFlow
  // No need for duplicate state management at this level

  // Initialize analytics tracking (fire-and-forget)
  useEffect(() => {
    // Store landing path for "how it works" detection
    if (typeof window !== 'undefined') {
      const landingPath = window.location.pathname + window.location.search;
      localStorage.setItem('posthog_landing_path', landingPath);
    }
    
    // Track page view in Supabase
    analytics.trackPageView({
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      utmSource: searchParams?.get('utm_source') || undefined,
      utmMedium: searchParams?.get('utm_medium') || undefined,
      utmCampaign: searchParams?.get('utm_campaign') || undefined,
    });
  }, [searchParams]); // Track when search params change

  // Check URL parameters on mount and when they change
  useEffect(() => {
    const overlay = searchParams?.get('overlay');
    if (overlay === 'how-it-works') {
      setShowHowItWorks(true);
      setOverlayOpen(OVERLAY_TYPES.HOW_IT_WORKS);
    }
    
    const view = searchParams?.get('view');
    if (view === 'chart') {
      setInitialView('chart');
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
    
    // Track as active user (meaningful action)
    checkAndTrackActive('guided_ranking_clicked', {
      page: 'ppm_tool',
      interaction_type: 'button_click',
      source: 'how_it_works_overlay'
    });
    
    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    setShowGuidedRanking(true); // Directly open guided ranking
  };

  const handleManualRanking = () => {
    trackClick('manual_ranking_button', { location: 'how_it_works_overlay' });
    trackTool('ppm_tool', 'started_manual_flow', { source: 'how_it_works' });
    
    // Track as active user (meaningful action)
    checkAndTrackActive('manual_ranking_clicked', {
      page: 'ppm_tool',
      interaction_type: 'button_click',
      source: 'how_it_works_overlay'
    });
    
    setShowHowItWorks(false);
    setOverlayClosed(OVERLAY_TYPES.HOW_IT_WORKS);
    // Go directly to manual tool selection
  };

  const handleGuidedRankingComplete = () => {
    trackTool('ppm_tool', 'guided_ranking_completed', { 
      source: 'guided_flow',
      completion_time: Date.now(),
      criterion_id: guidedRankingCriterionId
    });
    setShowGuidedRanking(false);
    setGuidedRankingCriterionId(undefined);
  };

  const handleOpenGuidedRanking = (criterionId?: string) => {
    trackClick('open_guided_ranking', { 
      location: 'main_page',
      criterion_id: criterionId,
      is_single_criterion: !!criterionId
    });
    trackTool('ppm_tool', 'opened_guided_ranking', { 
      source: 'main_page',
      criterion_id: criterionId,
      is_single_criterion: !!criterionId
    });
    setGuidedRankingCriterionId(criterionId);
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
    // Track closing of "how it works" - but don't count as active yet if user started here
    // Next meaningful action (clicking button, moving slider) will count as active
    checkAndTrackActive('how_it_works_close', {
      page: 'ppm_tool',
      interaction_type: 'close_modal'
    });
    
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
                guidedRankingCriterionId={guidedRankingCriterionId}
                onGuidedRankingComplete={handleGuidedRankingComplete}
                onOpenGuidedRanking={handleOpenGuidedRanking}
                onShowHowItWorks={handleShowHowItWorks}
                guidedButtonRef={guidedButtonRef}
                initialView={initialView}
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
