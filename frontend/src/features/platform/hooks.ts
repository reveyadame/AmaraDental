import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlatformToken } from '@/shared/api/platform-client'
import {
  createTenant,
  listPlans,
  listTenants,
  platformLogin,
  platformLogout,
  platformMe,
  updateTenant,
  type TenantStatus,
} from './api'

const meKey = ['platform', 'me'] as const
const tenantsKey = ['platform', 'tenants'] as const

export function usePlatformMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: platformMe,
    enabled: !!getPlatformToken(),
    retry: false,
  })
}

export function usePlatformLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      platformLogin(email, password),
    onSuccess: (admin) => qc.setQueryData(meKey, admin),
  })
}

export function usePlatformLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: platformLogout,
    onSuccess: () => {
      qc.setQueryData(meKey, null)
      qc.removeQueries({ queryKey: ['platform'] })
    },
  })
}

export function useTenants() {
  return useQuery({ queryKey: tenantsKey, queryFn: listTenants })
}

export function usePlans() {
  return useQuery({ queryKey: ['platform', 'plans'], queryFn: listPlans, staleTime: 300_000 })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantsKey }),
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number
      status?: TenantStatus
      name?: string
      plan_key?: string
    }) => updateTenant(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantsKey }),
  })
}
