import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/shared/api/query-client'
import { LandingApp } from '@/features/landing/LandingApp'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LandingApp />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
