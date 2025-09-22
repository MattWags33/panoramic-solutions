'use client';

import { useState } from 'react';
import { Tool, Criterion } from '../types';
import { PPMEmailTemplateGenerator } from '../utils/emailTemplateGenerator';
import { trackNewReportSent } from '@/lib/posthog';

interface UseEmailReportOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

interface EmailReportData {
  userEmail: string;
  firstName: string;
  lastName: string;
  selectedTools: Tool[];
  selectedCriteria: Criterion[];
  chartImageUrl?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export const useEmailReport = (options: UseEmailReportOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmailReport = async (data: EmailReportData): Promise<EmailResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!data.userEmail || !data.firstName || !data.lastName || !data.selectedTools.length || !data.selectedCriteria.length) {
        throw new Error('Missing required data for email report (email, first name, last name, tools, and criteria are required)');
      }

      // Generate chart image if not provided
      let chartImageUrl = data.chartImageUrl;
      if (!chartImageUrl) {
        try {
          chartImageUrl = await generateChartImage(data.selectedTools, data.selectedCriteria);
        } catch (chartError) {
          console.warn('Failed to generate chart image, continuing without chart:', chartError);
          // Continue without chart - the email template handles this gracefully
        }
      }

      // Check if we're in test mode (useful for debugging email delivery)
      const isTestMode = typeof window !== 'undefined' && 
        new URLSearchParams(window.location.search).get('emailTest') === 'true';

      // Generate email payload
      const emailPayload = await PPMEmailTemplateGenerator.generateResendPayload({
        userEmail: data.userEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        selectedTools: data.selectedTools,
        selectedCriteria: data.selectedCriteria,
        chartImageUrl,
        bookingLink: 'https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt',
        unsubscribeLink: `${getBaseUrl()}/unsubscribe`,
        preferencesLink: `${getBaseUrl()}/email-preferences`,
        logoUrl: `${getBaseUrl()}/images/Logo_Panoramic_Solutions.webp`,
        mattHeadshotUrl: `${getBaseUrl()}/images/Wagner_Headshot_2024.webp`
      }, isTestMode);

      // Get guided ranking data from localStorage for marketing insights
      let guidedRankingAnswers = null;
      let personalizationData = null;
      
      if (typeof window !== 'undefined') {
        try {
          const storedAnswers = localStorage.getItem('guidedRankingAnswers');
          const storedPersonalization = localStorage.getItem('personalizationData');
          
          if (storedAnswers) {
            guidedRankingAnswers = JSON.parse(storedAnswers);
            console.log('📊 Retrieved guided ranking answers for email:', guidedRankingAnswers);
          }
          
          if (storedPersonalization) {
            personalizationData = JSON.parse(storedPersonalization);
            console.log('👥 Retrieved personalization data for email:', personalizationData);
          }
        } catch (error) {
          console.warn('Failed to retrieve guided ranking data from localStorage:', error);
        }
      }

      // Send via API endpoint using new React email format
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: data.userEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          selectedTools: data.selectedTools,
          selectedCriteria: data.selectedCriteria,
          chartImageUrl: data.chartImageUrl,
          userAgent: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          guidedRankingAnswers,
          personalizationData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to send email`);
      }

      const result: EmailResponse = await response.json();
      
      // Track email send event (optional analytics)
      try {
        await trackEmailSent(data.userEmail, data.selectedTools.length, data.selectedCriteria.length);
      } catch (trackingError) {
        console.warn('Failed to track email event:', trackingError);
        // Don't fail the email send for tracking issues
      }

      // Track PostHog New_Report_Sent event
      try {
        trackNewReportSent({
          tool_count: data.selectedTools.length,
          criteria_count: data.selectedCriteria.length,
          has_chart: !!chartImageUrl,
          email_domain: data.userEmail.split('@')[1] || 'unknown',
          guided_ranking_used: !!guidedRankingAnswers,
          personalization_used: !!personalizationData,
          test_mode: isTestMode
        });
      } catch (posthogError) {
        console.warn('Failed to track PostHog report event:', posthogError);
        // Don't fail the email send for PostHog tracking issues
      }
      
      options.onSuccess?.(result);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      options.onError?.(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    sendEmailReport,
    isLoading,
    error,
    clearError
  };
};

/**
 * Helper function to get the base URL for the application
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://panoramic-solutions.com';
}

/**
 * Helper function to generate chart image
 */
async function generateChartImage(tools: Tool[], criteria: Criterion[]): Promise<string | undefined> {
  try {
    // Use canvas chart generation for Gmail compatibility
    if (tools.length > 0) {
      const tool = tools[0]; // Use first tool for chart
      const chartParams = new URLSearchParams({
        tool: tool.name,
        toolData: encodeURIComponent(JSON.stringify(tool)),
        criteria: criteria.map((c: any) => c.id).join(','),
        userRankings: criteria.map(() => '3').join(','), // Default ratings
        toolIndex: '0'
      });
      
      const imageUrl = `/api/chart/dynamic.png?${chartParams.toString()}`;
      console.log('📊 useEmailReport: Using canvas chart:', imageUrl);
      return imageUrl;
    } else {
      console.warn('No tools available for chart generation');
      return undefined;
    }
  } catch (error) {
    console.warn('Failed to generate chart image:', error);
    return undefined;
  }
}

/**
 * Helper function to track email send event for analytics
 */
async function trackEmailSent(email: string, toolCount: number, criteriaCount: number): Promise<void> {
  try {
    // Hash email for privacy
    const hashedEmail = await hashEmail(email);
    
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'email_report_sent',
        properties: {
          email_hash: hashedEmail,
          tool_count: toolCount,
          criteria_count: criteriaCount,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        }
      }),
      // Don't wait too long for analytics
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.warn('Failed to track email event:', error);
    // Don't throw - analytics failure shouldn't break email sending
  }
}

/**
 * Simple email hashing for privacy-compliant analytics
 */
async function hashEmail(email: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(email.toLowerCase().trim());
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.warn('Failed to hash email:', error);
  }
  
  // Fallback: return a simple hash
  return btoa(email.toLowerCase().trim()).substring(0, 16);
}
