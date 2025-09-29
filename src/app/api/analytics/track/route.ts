import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    // Validate required fields
    if (!event) {
      return NextResponse.json(
        { message: 'Event name is required' },
        { status: 400 }
      );
    }

    // Log the analytics event
    // In production, you might want to:
    // - Send to Google Analytics 4
    // - Send to Mixpanel, Amplitude, or other analytics service
    // - Store in your database for custom analytics
    // - Send to multiple analytics providers
    
    // Get IP from headers (Next.js 15 compatible)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    console.log('Analytics Event:', {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        ip,
        userAgent: request.headers.get('user-agent')
      }
    });

    // Optional: Send to external analytics service
    // await sendToGoogleAnalytics(event, properties);
    // await sendToMixpanel(event, properties);

    return NextResponse.json({ 
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    
    return NextResponse.json(
      { 
        message: 'Failed to track event',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Example function to send events to Google Analytics 4
 * Uncomment and configure if you want to use GA4
 */
/*
async function sendToGoogleAnalytics(event: string, properties: any) {
  const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID;
  const GA_API_SECRET = process.env.GA_API_SECRET;
  
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
    return;
  }

  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: properties.email_hash || 'anonymous',
        events: [{
          name: event,
          parameters: {
            tool_count: properties.tool_count,
            criteria_count: properties.criteria_count,
            timestamp: properties.timestamp
          }
        }]
      })
    });
  } catch (error) {
    console.warn('Failed to send to Google Analytics:', error);
  }
}
*/

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
