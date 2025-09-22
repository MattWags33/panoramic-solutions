import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StructuredData } from '@/features/seo/components/StructuredData'
import { StructuredData as MainStructuredData, organizationData, websiteData } from '@/components/seo/StructuredData'
import { generateSiteMetadata } from '@/shared/utils/seo'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ['latin'],
  display: 'optional', // Changed from 'swap' to 'optional' to prevent flash
  variable: '--font-inter',
  preload: true,
})

export function generateMetadata(): Metadata {
  return {
    ...generateSiteMetadata({
      title: 'Panoramic Solutions | SaaS Architecture & Digital Transformation',
      description: 'Transform your business with expert SaaS Architecture and Digital Transformation solutions. PMP® certified Solutions Architect Matt Wagner delivers measurable results for forward-thinking organizations.',
      keywords: 'SaaS Architecture, Digital Transformation, Project Management, Enterprise Automation, Matt Wagner, PMP, SAFe, Utah Consultant',
      canonicalUrl: 'https://panoramic-solutions.com',
    })
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
      </body>
    </html>
  )
}