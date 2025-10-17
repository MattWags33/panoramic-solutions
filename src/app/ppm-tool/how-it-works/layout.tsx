import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - PPM Tool Finder | Panoramic Solutions',
  description: 'Learn how our intelligent PPM Tool assessment works. Get personalized recommendations in minutes with our research-backed methodology.',
  openGraph: {
    title: 'How It Works - PPM Tool Finder',
    description: 'Learn how our intelligent PPM Tool assessment works. Get personalized recommendations in minutes.',
    type: 'website',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
