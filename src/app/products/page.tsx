import { Metadata } from 'next'
import { generateSiteMetadata } from '@/shared/utils/seo'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Wrench, Zap } from 'lucide-react'

export const metadata: Metadata = generateSiteMetadata({
  title: 'Products & Tools | Panoramic Solutions',
  description: 'Free PPM Tool Finder and project management solutions. Get personalized recommendations to streamline your digital transformation and boost project success rates.',
  keywords: 'PPM Tool Finder, Project Management Tools, Digital Transformation Products',
  canonicalUrl: 'https://panoramic-solutions.com/products',
})

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-midnight">
            Our <span className="text-gradient bg-gradient-to-r from-alpine to-summit bg-clip-text text-transparent">Products & Tools</span>
          </h1>
          <p className="text-xl text-midnight/70 max-w-3xl mx-auto mb-12">
            Powerful solutions designed to accelerate your digital transformation 
            and streamline project management processes.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* PPM-Tool */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-midnight/5">
              <div className="w-16 h-16 bg-gradient-to-br from-alpine to-summit rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="h-8 w-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-midnight mb-4">
                PPM-Tool
              </h3>
              
              <p className="text-midnight/70 mb-6 leading-relaxed">
                Interactive Project Portfolio Management comparison tool 
                to evaluate and compare different PPM platforms for your organization.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-sm text-midnight/60">
                  <Zap className="h-4 w-4 mr-2 text-summit" />
                  Compare multiple PPM platforms
                </div>
                <div className="flex items-center text-sm text-midnight/60">
                  <Zap className="h-4 w-4 mr-2 text-summit" />
                  Detailed feature analysis
                </div>
                <div className="flex items-center text-sm text-midnight/60">
                  <Zap className="h-4 w-4 mr-2 text-summit" />
                  Interactive comparison charts
                </div>
              </div>
              
              <Button asChild className="w-full bg-alpine hover:bg-summit">
                <Link href="/ppm-tool">
                  Explore Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Coming Soon Placeholder 1 */}
            <div className="bg-white/50 rounded-2xl p-8 border-2 border-dashed border-midnight/20 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 bg-midnight/10 rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="h-8 w-8 text-midnight/40" />
              </div>
              
              <h3 className="text-2xl font-bold text-midnight/60 mb-4">
                More Tools Coming Soon
              </h3>
              
              <p className="text-midnight/50 mb-6">
                We&apos;re developing additional tools to help streamline your digital transformation journey.
              </p>
              
              <Button variant="outline" disabled className="opacity-50">
                Coming Soon
              </Button>
            </div>

            {/* Coming Soon Placeholder 2 */}
            <div className="bg-white/50 rounded-2xl p-8 border-2 border-dashed border-midnight/20 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 bg-midnight/10 rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="h-8 w-8 text-midnight/40" />
              </div>
              
              <h3 className="text-2xl font-bold text-midnight/60 mb-4">
                Enterprise Solutions
              </h3>
              
              <p className="text-midnight/50 mb-6">
                Custom enterprise solutions and automation tools tailored to your specific needs.
              </p>
              
              <Button variant="outline" disabled className="opacity-50">
                Coming Soon
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-midnight via-alpine to-summit">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Let&apos;s discuss how we can build the perfect tools and solutions for your organization.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-alpine hover:bg-white/90"
            asChild
          >
            <a href="https://app.onecal.io/b/matt-wagner/schedule-a-meeting-with-matt" target="_blank" rel="noopener noreferrer">
              Schedule a Consultation
            </a>
          </Button>
        </div>
      </section>
    </div>
  )
}
