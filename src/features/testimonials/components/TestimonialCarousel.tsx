'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { testimonials } from '../data/testimonials'

interface TestimonialCarouselProps {
  className?: string
  autoPlay?: boolean
  interval?: number
  backgroundColor?: 'white' | 'snow'
}

export function TestimonialCarousel({ 
  className = '', 
  autoPlay = true, 
  interval = 5000,
  backgroundColor = 'snow'
}: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Prevent hydration mismatches by waiting for client-side hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current)
      autoPlayTimerRef.current = null
    }
  }, [])

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  }, [])

  const nextTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevTestimonial = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  const goToTestimonial = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsUserInteracting(true)
  }, [])

  const handleNext = useCallback(() => {
    nextTestimonial()
    setIsUserInteracting(true)
  }, [nextTestimonial])

  const handlePrev = useCallback(() => {
    prevTestimonial()
    setIsUserInteracting(true)
  }, [prevTestimonial])

  // Auto-play effect - only start after hydration to prevent mismatches
  useEffect(() => {
    if (!autoPlay || isUserInteracting || !isHydrated) {
      clearAutoPlayTimer()
      return
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextTestimonial()
    }, interval)

    return () => {
      clearAutoPlayTimer()
    }
  }, [autoPlay, interval, isUserInteracting, isHydrated, nextTestimonial, clearAutoPlayTimer])

  // Reset user interaction after some time
  useEffect(() => {
    if (!isUserInteracting) {
      clearResetTimer()
      return
    }

    resetTimerRef.current = setTimeout(() => {
      setIsUserInteracting(false)
    }, interval * 2)

    return () => {
      clearResetTimer()
    }
  }, [isUserInteracting, interval, clearResetTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAutoPlayTimer()
      clearResetTimer()
    }
  }, [clearAutoPlayTimer, clearResetTimer])

  return (
    <div className={`relative ${className}`}>
      <div className="relative h-auto min-h-[320px] sm:min-h-[400px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className={`absolute inset-0 flex flex-col justify-center p-3 sm:p-6 ${backgroundColor === 'white' ? 'bg-white' : 'bg-snow'} border border-midnight/10 rounded-lg shadow-lg`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stars */}
            <div className="flex space-x-1 mb-3 sm:mb-4 justify-center sm:justify-start">
              {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 fill-summit text-summit" />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-sm sm:text-base text-midnight mb-4 sm:mb-6 italic text-center sm:text-left leading-relaxed">
              &ldquo;{testimonials[currentIndex].quote}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="text-sm text-center sm:text-left">
              <div className="font-semibold text-midnight">
                {testimonials[currentIndex].author}
              </div>
              <div className="text-midnight/70">
                {testimonials[currentIndex].title}, {testimonials[currentIndex].company}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 sm:mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          className="text-alpine hover:text-summit hover:bg-alpine/5 p-2"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Dots */}
        <div className="flex space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-6 h-6 min-w-6 min-h-6 rounded-full transition-colors ${
                index === currentIndex ? 'bg-alpine' : 'bg-midnight/20'
              }`}
              onClick={() => goToTestimonial(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          className="text-alpine hover:text-summit hover:bg-alpine/5 p-2"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}