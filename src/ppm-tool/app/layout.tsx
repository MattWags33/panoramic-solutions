import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
});

export function generateMetadata(): Metadata {
  return {
    title: 'PPM Tool Finder',
    description: 'A comprehensive Portfolio Management (PPM) tool comparison platform'
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <SpeedInsights 
          sampleRate={1}
          debug={process.env.NODE_ENV === 'development'}
        />
        <Analytics 
          debug={process.env.NODE_ENV === 'development'}
        />
      </body>
    </html>
  );
}
