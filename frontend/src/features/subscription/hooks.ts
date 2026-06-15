import { useQuery } from '@tanstack/react-query'
import { getSubscription } from './api'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
    staleTime: 60_000,
  })
}
