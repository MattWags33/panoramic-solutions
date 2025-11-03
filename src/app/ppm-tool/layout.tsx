import type { Metadata } from 'next';
import { headers } from 'next/headers';

// Helper to get the base URL from request headers (runs at request time)
async function getBaseUrl(): Promise<string> {
  // Check for environment variable first (takes precedence)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Get the request headers to determine the current domain
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    
    // Use the request host (works for both staging and production)
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // Fallback if headers aren't available (build time)
    console.warn('Could not read headers, using fallback URL');
  }
  
  // Fallback for build time or when headers aren't available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to production
  return 'https://panoramic-solutions.com';
}

// Generate metadata dynamically at request time
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const ppmToolUrl = `${baseUrl}/ppm-tool`;
  const ogImageUrl = `${baseUrl}/images/PPM_Tool_Finder.png`;

  return {
    title: 'PPM Tool Finder | Find Your Perfect Project Portfolio Management Tool',
    description: 'Discover the perfect Project Portfolio Management (PPM) tool for your organization. Our intelligent assessment analyzes your specific needs and provides personalized tool recommendations in minutes.',
    keywords: 'PPM Tool Finder, Project Portfolio Management, PPM Software, Project Management Tools, Portfolio Management Software, Tool Assessment',
    authors: [{ name: 'Matt Wagner', url: baseUrl }],
    creator: 'Panoramic Solutions',
    publisher: 'Panoramic Solutions',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: ppmToolUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: ppmToolUrl,
      title: 'PPM Tool Finder | Find Your Perfect Project Portfolio Management Tool',
      description: 'Discover the perfect Project Portfolio Management (PPM) tool for your organization. Our intelligent assessment analyzes your specific needs and provides personalized tool recommendations in minutes.',
      siteName: 'Panoramic Solutions',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'PPM Tool Finder - Find Your Perfect Project Portfolio Management Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PPM Tool Finder | Find Your Perfect Project Portfolio Management Tool',
      description: 'Discover the perfect Project Portfolio Management (PPM) tool for your organization. Our intelligent assessment analyzes your specific needs and provides personalized tool recommendations in minutes.',
      images: [ogImageUrl],
      creator: '@panoramicsol',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default function PPMToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

