'use client'

import { ReactNode } from 'react'
import { ScrollToTop } from './ScrollToTop'

// Import PostHog initialization
import '@/instrumentation-client'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  )
}
