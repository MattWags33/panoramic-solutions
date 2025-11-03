import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StructuredData } from '@/features/seo/components/StructuredData'
import { StructuredData as MainStructuredData, organizationData, websiteData } from '@/components/seo/StructuredData'
import { generateSiteMetadata } from '@/shared/utils/seo'
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'optional', // Changed from 'swap' to 'optional' to prevent flash
  variable: '--font-inter',
  preload: true,
})

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
    console.warn('Could not read headers in root layout, using fallback URL');
  }
  
  // Fallback for build time or when headers aren't available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default to production
  return 'https://panoramic-solutions.com';
}

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  
  return {
    ...generateSiteMetadata({
      title: 'Panoramic Solutions | SaaS Architecture & Digital Transformation',
      description: 'Transform your business with expert SaaS Architecture and Digital Transformation solutions. PMP® certified Solutions Architect Matt Wagner delivers measurable results for forward-thinking organizations.',
      keywords: 'SaaS Architecture, Digital Transformation, Project Management, Enterprise Automation, Matt Wagner, PMP, SAFe, Utah Consultant',
      canonicalUrl: baseUrl,
    }),
    metadataBase: new URL(baseUrl), // Dynamic metadataBase for all child routes
  }
}

export const viewport: Viewport = {
  themeColor: '#0057B7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Favicon and touch icons - proper order and format */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/images/Logo_Panoramic_Solutions.webp" sizes="180x180" />
        <StructuredData />
        <MainStructuredData data={organizationData} />
        <MainStructuredData data={websiteData} />
        {/* Critical CSS to prevent mobile flashing */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical mobile styles to prevent FOUC */
            * {
              -webkit-tap-highlight-color: transparent;
              box-sizing: border-box;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            body {
              font-family: var(--font-inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
              background-color: white;
              color: rgb(11, 30, 45);
            }
            
            /* Prevent layout shifts on mobile */
            @media (max-width: 768px) {
              .min-h-screen {
                min-height: 100vh;
                min-height: 100dvh;
              }
              
              body {
                width: 100%;
                -webkit-overflow-scrolling: touch;
              }
              
              /* Mobile content stabilization */
              main {
                flex: 1;
                width: 100%;
              }
            }
          `
        }} />
      </head>
      <body className="font-sans antialiased bg-white">
        <ClientProviders>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </ClientProviders>
        <SpeedInsights 
          sampleRate={1}
          debug={process.env.NODE_ENV === 'development'}
        />
        <Analytics 
          debug={process.env.NODE_ENV === 'development'}
        />
      </body>
    </html>
  )
}