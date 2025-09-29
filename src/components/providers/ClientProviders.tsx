'use client'

import { ReactNode } from 'react'
import { ScrollToTop } from './ScrollToTop'

// Import PostHog initialization
import '@/instrumentation-client'

// Import error suppression to handle browser extension errors
import '@/lib/errorSuppression'

// Import error suppression test in development
if (process.env.NODE_ENV === 'development') {
  import('@/lib/testErrorSuppression')
}

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
