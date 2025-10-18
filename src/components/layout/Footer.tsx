'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useUnifiedMobileDetection } from '@/ppm-tool/shared/hooks/useUnifiedMobileDetection'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  }
}

export function Footer() {
  const { isMobile } = useUnifiedMobileDetection()
  
  // Use regular div on mobile to prevent stacking context issues
  const ContainerComponent = isMobile ? 'div' : motion.div
  const ItemComponent = isMobile ? 'div' : motion.div
  
  const containerProps = isMobile 
    ? { className: "container mx-auto px-4 py-12 md:px-6 lg:px-8 max-w-6xl" }
    : { 
        className: "container mx-auto px-4 py-12 md:px-6 lg:px-8 max-w-6xl",
        initial: "hidden",
        animate: "visible",
        variants: containerVariants
      }

  return (
    <footer className="border-t border-midnight/10 bg-gradient-to-br from-slate-50 to-blue-50/30 text-midnight">
      <ContainerComponent {...containerProps}>
        <div className="grid gap-12 md:grid-cols-3 lg:gap-16">
          {/* Logo and Description */}
          <ItemComponent {...(isMobile ? { className: "md:col-span-1" } : { variants: itemVariants, className: "md:col-span-1" })}>
            <ItemComponent 
              {...(isMobile 
                ? { className: "flex items-center space-x-3 mb-6" }
                : { className: "flex items-center space-x-3 mb-6", variants: itemVariants }
              )}
            >
              <div className="relative h-10 w-10">
                <Image
                  src="/images/Logo_Panoramic_Solutions.webp"
                  alt="Panoramic Solutions Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-midnight">
                Panoramic Solutions
              </span>
            </ItemComponent>
            <ItemComponent 
              {...(isMobile 
                ? { className: "text-midnight/70 mb-6 leading-relaxed" }
                : { className: "text-midnight/70 mb-6 leading-relaxed", variants: itemVariants }
              )}
            >
              End-to-end excellence in software development, SaaS architecture, and project management solutions.
            </ItemComponent>
            
            {/* Contact Info */}
            <ItemComponent 
              {...(isMobile 
                ? { className: "mb-6 space-y-2 text-sm text-midnight/70" }
                : { className: "mb-6 space-y-2 text-sm text-midnight/70", variants: itemVariants }
              )}
            >
              <p className="font-medium text-midnight">Get in touch</p>
              <p>Salt Lake City, Utah</p>
            </ItemComponent>
          </ItemComponent>

          {/* Quick Links */}
          <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
            <ItemComponent 
              {...(isMobile 
                ? { className: "mb-6 text-lg font-bold text-midnight" }
                : { className: "mb-6 text-lg font-bold text-midnight", variants: itemVariants }
              )}
            >
              Quick Links
            </ItemComponent>
            <ItemComponent 
              {...(isMobile 
                ? { className: "space-y-1.5" }
                : { className: "space-y-1.5", variants: containerVariants }
              )}
            >
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <Link href="/" className="block text-midnight/70 hover:text-alpine transition-colors duration-200 font-medium">
                  Home
                </Link>
              </ItemComponent>
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <Link href="/offerings" className="block text-midnight/70 hover:text-alpine transition-colors duration-200 font-medium">
                  Offerings
                </Link>
              </ItemComponent>
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <Link href="/about" className="block text-midnight/70 hover:text-alpine transition-colors duration-200 font-medium">
                  About
                </Link>
              </ItemComponent>
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <Link href="/contact" className="block text-midnight/70 hover:text-alpine transition-colors duration-200 font-medium">
                  Contact
                </Link>
              </ItemComponent>
            </ItemComponent>
          </ItemComponent>

          {/* Products */}
          <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
            <ItemComponent 
              {...(isMobile 
                ? { className: "mb-6 text-lg font-bold text-midnight" }
                : { className: "mb-6 text-lg font-bold text-midnight", variants: itemVariants }
              )}
            >
              Products
            </ItemComponent>
            <ItemComponent 
              {...(isMobile 
                ? { className: "space-y-3" }
                : { className: "space-y-3", variants: containerVariants }
              )}
            >
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <Link href="/ppm-tool" className="block text-midnight/70 hover:text-alpine transition-colors duration-200 font-medium">
                  PPM Tool Finder
                </Link>
              </ItemComponent>
              <ItemComponent {...(isMobile ? {} : { variants: itemVariants })}>
                <p className="text-sm text-midnight/60 leading-relaxed">
                  Discover the perfect project management tool for your organization with our interactive comparison platform.
                </p>
              </ItemComponent>
            </ItemComponent>
          </ItemComponent>
        </div>
        
        {/* Footer Bottom */}
        <ItemComponent 
          {...(isMobile 
            ? { className: "mt-8 flex justify-center border-t border-midnight pt-6 text-center" }
            : { className: "mt-8 flex justify-center border-t border-midnight pt-6 text-center", variants: itemVariants }
          )}
        >
          <ItemComponent 
            {...(isMobile 
              ? { className: "text-sm text-midnight/70" }
              : { className: "text-sm text-midnight/70", variants: itemVariants }
            )}
          >
            © 2025 Panoramic Solutions. All rights reserved.
          </ItemComponent>
        </ItemComponent>
      </ContainerComponent>
    </footer>
  )
}