// Attribution tracking for user source detection
interface UserAttribution {
  source_category: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page: string;
  timestamp: number;
  session_id: string;
}

/**
 * Capture user attribution on first visit and persist for the entire user journey
 */
export const captureAttribution = (): UserAttribution => {
  // Check if already captured (persist forever until localStorage cleared)
  const existing = localStorage.getItem('user_attribution');
  if (existing) {
    return JSON.parse(existing);
  }

  const attribution: UserAttribution = {
    source_category: detectSourceCategory(document.referrer),
    referrer: document.referrer || 'direct',
    utm_source: getUrlParam('utm_source'),
    utm_medium: getUrlParam('utm_medium'),
    utm_campaign: getUrlParam('utm_campaign'),
    utm_content: getUrlParam('utm_content'),
    utm_term: getUrlParam('utm_term'),
    landing_page: window.location.href,
    timestamp: Date.now(),
    session_id: generateSessionId()
  };

  // Store permanently until user clears data
  localStorage.setItem('user_attribution', JSON.stringify(attribution));
  console.log('🎯 User attribution captured:', attribution);
  
  return attribution;
};

/**
 * Detect user source category from referrer domain
 */
const detectSourceCategory = (referrer: string): string => {
  if (!referrer) return 'Direct Traffic';
  
  const ref = referrer.toLowerCase();
  
  // Social Media
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) return 'YouTube';
  if (ref.includes('linkedin.com')) return 'LinkedIn';
  if (ref.includes('facebook.com') || ref.includes('fb.com')) return 'Facebook';
  if (ref.includes('twitter.com') || ref.includes('t.co') || ref.includes('x.com')) return 'Twitter';
  if (ref.includes('instagram.com')) return 'Instagram';
  if (ref.includes('reddit.com')) return 'Reddit';
  
  // Search Engines
  if (ref.includes('google.com')) return 'Google Search';
  if (ref.includes('bing.com')) return 'Bing Search';
  if (ref.includes('duckduckgo.com')) return 'DuckDuckGo';
  
  // PPM Tool Communities (flexible patterns)
  if (ref.includes('smartsheet') && (ref.includes('community') || ref.includes('forum'))) return 'Smartsheet Community';
  if (ref.includes('airtable') && (ref.includes('community') || ref.includes('forum'))) return 'Airtable Community';
  if (ref.includes('asana') && (ref.includes('community') || ref.includes('forum'))) return 'Asana Community';
  if (ref.includes('monday') && (ref.includes('community') || ref.includes('forum'))) return 'Monday.com Community';
  if (ref.includes('clickup') && (ref.includes('community') || ref.includes('forum'))) return 'ClickUp Community';
  if (ref.includes('jira') && (ref.includes('community') || ref.includes('forum'))) return 'Jira Community';
  if (ref.includes('atlassian') && (ref.includes('community') || ref.includes('forum'))) return 'Atlassian Community';
  
  // General PPM/Project Management Sites
  if (ref.includes('projectmanagement.com')) return 'ProjectManagement.com';
  if (ref.includes('pmi.org')) return 'PMI.org';
  
  // Unknown referrer
  return 'Other Referrer';
};

/**
 * Get URL parameter value
 */
const getUrlParam = (param: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || undefined;
};

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get stored attribution data
 */
export const getAttribution = (): UserAttribution | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem('user_attribution');
  return stored ? JSON.parse(stored) : null;
};

/**
 * Clear attribution data (useful for testing)
 */
export const clearAttribution = (): void => {
  localStorage.removeItem('user_attribution');
  console.log('🧹 Attribution data cleared');
};

/**
 * Debug function to see current attribution
 */
export const debugAttribution = (): void => {
  const attribution = getAttribution();
  console.log('🔍 Current attribution:', attribution);
};

// Make debug functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAttribution = debugAttribution;
  (window as any).clearAttribution = clearAttribution;
  console.log('🔧 Attribution debug functions available: debugAttribution(), clearAttribution()');
}
