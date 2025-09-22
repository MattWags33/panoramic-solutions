// This file configures client-side initialization
import posthog from 'posthog-js';

// Initialize PostHog
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: 'https://us.posthog.com', // For linking to PostHog dashboards
  
  // Core capture settings
  capture_pageview: true,
  capture_pageleave: true,
  
  // Session recording (optional - set to false if you don't want recordings)
  session_recording: {
    enabled: true,
    maskAllInputs: true, // Mask sensitive form inputs
    maskAllText: false,  // Don't mask regular text
    recordCrossOriginIframes: false
  },
  
  // Autocapture settings for form interactions
  autocapture: {
    capture_pageview: true,
    capture_pageleave: true,
    dom_event_allowlist: [], // Let our custom tracking handle events
    url_allowlist: [], // Track on all URLs
    element_allowlist: [] // Track all elements we specify
  },
  
  // Person profiles (for identifying users)
  person_profiles: 'always', // Create profiles for all users
  
  // Privacy and performance
  respect_dnt: true, // Respect Do Not Track
  opt_out_capturing_by_default: false,
  cross_subdomain_cookie: true,
  
  // Development settings
  debug: process.env.NODE_ENV === 'development',
  
  // Custom properties for all events
  bootstrap: {
    distinctID: undefined, // Let PostHog handle this
  },
  
  // Loaded callback for additional configuration
  loaded: (posthog) => {
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      posthog.debug();
      console.log('🎯 PostHog initialized successfully (DEV MODE)');
    } else {
      console.log('🎯 PostHog initialized successfully');
    }
    
    // Set default properties for all events
    posthog.register({
      'app_version': '1.0.0',
      'environment': process.env.NODE_ENV || 'production',
      'app_name': 'PPM Tool Finder'
    });
    
    // Make PostHog available globally for debugging and manual calls
    if (typeof window !== 'undefined') {
      (window as any).posthog = posthog;
    }
  }
});

// Make PostHog available globally
if (typeof window !== 'undefined') {
  (window as any).posthog = posthog;
}

// Also export for ES modules
export { posthog };