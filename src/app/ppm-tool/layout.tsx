import type { Metadata } from 'next';

// Helper to get the base URL for the current environment
function getBaseUrl(): string {
  // Check for environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Check for Vercel environment variables (staging/preview)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to production
  return 'https://panoramic-solutions.com';
}

// Get the canonical URL for the PPM tool page
function getPPMToolUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/ppm-tool`;
}

// Get the OG image URL (always use absolute URL)
function getOGImageUrl(): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/images/PPM_Tool_Finder.png`;
}

const baseUrl = getBaseUrl();
const ppmToolUrl = getPPMToolUrl();
const ogImageUrl = getOGImageUrl();

export const metadata: Metadata = {
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

export default function PPMToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

