import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPlatformToken } from '@/shared/api/platform-client'
import {
  createAdmin,
  createTenant,
  deleteAdmin,
  deleteTenant,
  getStats,
  getTenant,
  listAdmins,
  listPlans,
  listTenants,
  platformLogin,
  platformLogout,
  platformMe,
  updateAdmin,
  updatePlan,
  updateTenant,
  type CreateAdminPayload,
  type TenantStatus,
  type UpdateAdminPayload,
  type UpdatePlanPayload,
} from './api'

const meKey = ['platform', 'me'] as const
const tenantsKey = ['platform', 'tenants'] as const
const plansKey = ['platform', 'plans'] as const
const adminsKey = ['platform', 'admins'] as const
const statsKey = ['platform', 'stats'] as const

// ── Auth ─────────────────────────────────────────────────────────────────────

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

// ── Dashboard ──────────────────────────────────────────────────────────────

export function useStats() {
  return useQuery({ queryKey: statsKey, queryFn: getStats, staleTime: 60_000 })
}

// ── Clínicas ─────────────────────────────────────────────────────────────────

export function useTenants() {
  return useQuery({ queryKey: tenantsKey, queryFn: listTenants })
}

/** Detalle de una clínica (conteos + billing + facturas). Hace llamadas a Stripe. */
export function useTenantDetail(id: number | null) {
  return useQuery({
    queryKey: ['platform', 'tenant', id],
    queryFn: () => getTenant(id as number),
    enabled: id !== null,
    retry: false,
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsKey })
      qc.invalidateQueries({ queryKey: statsKey })
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsKey })
      qc.invalidateQueries({ queryKey: statsKey })
    },
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, confirmSlug }: { id: number; confirmSlug: string }) =>
      deleteTenant(id, confirmSlug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantsKey })
      qc.invalidateQueries({ queryKey: statsKey })
      qc.invalidateQueries({ queryKey: plansKey })
    },
  })
}

// ── Planes ───────────────────────────────────────────────────────────────────

export function usePlans() {
  return useQuery({ queryKey: plansKey, queryFn: listPlans, staleTime: 300_000 })
}

export function useUpdatePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdatePlanPayload) => updatePlan(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey })
      qc.invalidateQueries({ queryKey: tenantsKey })
    },
  })
}

// ── Super-admins ─────────────────────────────────────────────────────────────

export function useAdmins() {
  return useQuery({ queryKey: adminsKey, queryFn: listAdmins })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdminPayload) => createAdmin(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminsKey }),
  })
}

export function useUpdateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateAdminPayload) => updateAdmin(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminsKey }),
  })
}

export function useDeleteAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAdmin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminsKey }),
  })
}
