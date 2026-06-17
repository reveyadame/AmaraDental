import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { checkSlug, getPublicPlans, signup } from './api'

export function usePublicPlans() {
  return useQuery({ queryKey: ['public', 'plans'], queryFn: getPublicPlans, staleTime: 300_000 })
}

/** Debounce simple para no consultar disponibilidad en cada tecla. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Verifica disponibilidad del subdominio (ya debounced por el caller). */
export function useSlugCheck(slug: string) {
  return useQuery({
    queryKey: ['public', 'slug', slug],
    queryFn: () => checkSlug(slug),
    enabled: slug.length >= 3,
    staleTime: 30_000,
    retry: false,
  })
}

export function useSignup() {
  return useMutation({ mutationFn: signup })
}
