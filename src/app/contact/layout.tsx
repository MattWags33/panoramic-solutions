import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Panoramic Solutions | Schedule a Discovery Call',
  description: 'Ready to transform your business? Contact Panoramic Solutions for expert SaaS architecture, digital transformation, and project management solutions.',
  keywords: 'Contact Panoramic Solutions, Schedule Discovery Call, SaaS Consulting, Digital Transformation Services, Matt Wagner',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
