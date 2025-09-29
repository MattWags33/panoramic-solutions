import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Matt Wagner | Panoramic Solutions',
  description: 'Meet Matt Wagner, PMP® certified Solutions Architect and founder of Panoramic Solutions. Specialized in SaaS architecture, digital transformation, and enterprise automation.',
  keywords: 'Matt Wagner, PMP, SAFe Agilist, Solutions Architect, SaaS Architecture, Digital Transformation, Project Management',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
