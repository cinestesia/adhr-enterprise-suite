/**
 * @note
 * Punto di aggregazione per tutti i contesti client side
 */

'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import SessionWrapper from './SessionWrapper'
import { TooltipProvider } from './ui/tooltip'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </QueryClientProvider>
    </SessionWrapper>
  )
}
