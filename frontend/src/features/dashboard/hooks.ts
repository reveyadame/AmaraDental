import { useQuery } from '@tanstack/react-query'
import { getDashboard } from './api'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}
