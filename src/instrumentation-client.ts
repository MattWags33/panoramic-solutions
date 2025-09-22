// This file configures client-side initialization
import posthog from 'posthog-js';

// Only initialize PostHog on the client side
if (typeof window !== 'undefined') {
  // Initialize PostHog
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    ui_host: 'https://us.posthog.com', // For linking to PostHog dashboards
    
    // Core capture settings
    capture_pageview: true,
    capture_pageleave: true,
    
    // Session recording (optional - set disable_session_recording: true to disable)
    session_recording: {
      maskAllInputs: true // Mask sensitive form inputs for privacy
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
      (window as any).posthog = posthog;
    }
  });
}

// Also export for ES modules  
export { posthog };