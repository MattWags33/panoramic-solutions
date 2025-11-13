// This file configures client-side initialization
import posthog from 'posthog-js';
import { captureAttribution } from '@/lib/attribution';

// Only initialize PostHog on the client side
if (typeof window !== 'undefined') {
  // Initialize PostHog
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: 'https://us.posthog.com', // For linking to PostHog dashboards
    
    // Core capture settings
    capture_pageview: true,
    capture_pageleave: false, // ✅ DISABLED: Reduce noise and costs
    
    // ✅ NEW: Autocapture configuration (reduces costs by ~50%)
    autocapture: {
      dom_event_allowlist: ['click'], // Only capture clicks, not all DOM events
      url_allowlist: ['/ppm-tool'], // Only track PPM tool pages
      element_allowlist: ['button', 'a'], // Only buttons and links
      css_selector_allowlist: ['.track-click', '[data-track]'] // Only elements we explicitly mark
    },
    
    // ✅ COST OPTIMIZATION: Disable session recording by default (can enable selectively)
    disable_session_recording: true, // Reduces costs significantly
    
    // Person profiles (for identifying users)
    person_profiles: 'always', // Create profiles for all users
    
    // Privacy and performance
    respect_dnt: true, // Respect Do Not Track
    opt_out_capturing_by_default: false,
    cross_subdomain_cookie: true,
    
    // Production domain configuration
    secure_cookie: true, // Ensure HTTPS cookies for production
    
    // Development settings - reduced logging
    debug: false, // Disabled to reduce console noise
    
    // Custom properties for all events
    bootstrap: {
      distinctID: undefined, // Let PostHog handle this
    },
    
    // Error handling for network issues
    on_request_error: (error) => {
      // Silently handle PostHog network errors in development
      if (process.env.NODE_ENV === 'development') {
        // Don't log every network error to reduce console noise
        return;
      }
      console.warn('PostHog request failed:', error);
    },
    
    // Loaded callback for additional configuration
    loaded: (posthog) => {
      try {
        // Capture user attribution on first PostHog load
        captureAttribution();
        
        // Domain validation for production tracking
        const currentDomain = window.location.hostname;
        const isProduction = process.env.NODE_ENV === 'production';
        const isProductionDomain = currentDomain === 'panoramic-solutions.com' || 
                                 currentDomain.endsWith('.panoramic-solutions.com');
        
        // Warn if production environment but not on production domain
        if (isProduction && !isProductionDomain) {
          console.warn('⚠️ PostHog: Production environment detected but not on production domain:', currentDomain);
        }
        
        // Log successful initialization
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 PostHog initialized successfully');
          console.log('📍 Domain:', currentDomain);
          console.log('🌍 Environment:', process.env.NODE_ENV);
        } else if (isProductionDomain) {
          console.log('🎯 PostHog tracking active on production domain');
        }
      } catch (error) {
        console.warn('PostHog initialization warning:', error);
      }
      
      // Set default properties for all events
      posthog.register({
        'app_version': '1.0.0',
        'environment': process.env.NODE_ENV || 'production',
        'app_name': 'PPM Tool Finder',
        'domain': window.location.hostname,
        'site_url': window.location.origin
      });
      
      // Make PostHog available globally for debugging and manual calls
      (window as any).posthog = posthog;
    }
  });
}

// Also export for ES modules  
export { posthog };