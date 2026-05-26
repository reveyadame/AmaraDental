import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchBranding, fetchMe, login, logout, type LoginPayload } from './api'
import type { User } from '@/shared/types/api'

const ME_KEY = ['auth', 'me'] as const
const BRANDING_KEY = ['branding'] as const

export function useMe() {
  return useQuery<User | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await fetchMe()
      } catch (error: unknown) {
        const status =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined
        if (status === 401) return null
        throw error
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useBranding() {
  return useQuery({
    queryKey: BRANDING_KEY,
    queryFn: fetchBranding,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user)
      navigate('/', { replace: true })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(ME_KEY, null)
      queryClient.removeQueries({ queryKey: ['users'] })
      navigate('/login', { replace: true })
    },
  })
}
