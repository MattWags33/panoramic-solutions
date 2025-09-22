import { Metadata } from 'next'
import { generateSiteMetadata } from '@/shared/utils/seo'
import { OfferingsPageContent } from '@/features/offerings/components/OfferingsPageContent'

export const metadata: Metadata = generateSiteMetadata({
  title: 'Our Offerings | Panoramic Solutions',
  description: 'Expert project portfolio management, SaaS architecture, and digital transformation services that drive measurable business results. Professional implementation and consulting from certified PMP®.',
  keywords: 'project management offerings, SaaS architecture, business systems implementation, enterprise automation, digital transformation, Utah consulting',
  canonicalUrl: 'https://panoramic-solutions.com/offerings',
})

export default function OfferingsPage() {
  return <OfferingsPageContent />
}