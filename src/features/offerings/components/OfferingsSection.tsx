'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OfferingCard } from './OfferingCard'
import { ArrowRight, Cloud, Zap, Settings } from 'lucide-react'
import { useIntersectionObserver } from '@/shared/hooks/useIntersectionObserver'

const fastFadeIn = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const
    }
  },
}

const slideInUpFast = {
  initial: { 
    opacity: 0, 
    y: 20,
    transform: "translateZ(0)" // Force GPU acceleration
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    }
  },
}

export function OfferingsSection() {
  const { ref: sectionRef, isIntersecting } = useIntersectionObserver()

  return (
    <section ref={sectionRef} className="mobile-py bg-white">
      <div className="container max-w-6xl mx-auto mobile-px">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          variants={fastFadeIn}
          initial="initial"
          animate={isIntersecting ? "animate" : "initial"}
        >
          <h2 className="section-heading-mobile font-bold text-midnight mb-4 sm:mb-6">
            Core <span className="text-midnight">Specialties</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto mb-8 sm:mb-12">
          <motion.div
            variants={slideInUpFast}
            initial="initial"
            animate={isIntersecting ? "animate" : "initial"}
            style={{ willChange: 'transform, opacity' }}
          >
            <OfferingCard
              icon={Cloud}
              title="Project & Portfolio Consulting"
              excerpt="Project portfolio management offerings with certified expertise including PPM tool selection, implementation, and ongoing support."
              showLearnMore={false}
            />
          </motion.div>
          
          <motion.div
            variants={slideInUpFast}
            initial="initial"
            animate={isIntersecting ? "animate" : "initial"}
            transition={{ delay: 0.1 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <OfferingCard
              icon={Zap}
              title="Business Applications"
              excerpt="End-to-end business solutions and system implementations including SaaS architecture, system integration, and business process automation."
              showLearnMore={false}
            />
          </motion.div>
          
          <motion.div
            variants={slideInUpFast}
            initial="initial"
            animate={isIntersecting ? "animate" : "initial"}
            transition={{ delay: 0.2 }}
            style={{ willChange: 'transform, opacity' }}
          >
            <OfferingCard
              icon={Settings}
              title="Development & Integration Services"
              excerpt="Custom development and technical integration solutions including rapid prototyping, application development, and technical architecture."
              showLearnMore={false}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}