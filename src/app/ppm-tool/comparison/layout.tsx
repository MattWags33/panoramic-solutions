import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comparison Chart - PPM Tool Finder | Panoramic Solutions',
  description: 'Compare project portfolio management tools side-by-side. View your requirements against tool capabilities with our interactive comparison chart.',
  openGraph: {
    title: 'Comparison Chart - PPM Tool Finder',
    description: 'Compare project portfolio management tools side-by-side with our interactive comparison chart.',
    type: 'website',
  },
};

export default function ComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

