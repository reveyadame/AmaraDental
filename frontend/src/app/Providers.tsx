import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { queryClient } from '@/shared/api/query-client'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { Toaster } from '@/shared/ui/sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
