import { platformApi, setPlatformToken } from '@/shared/api/platform-client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Invoice } from '@/features/billing/api'

export interface PlatformAdmin {
  id: number
  name: string
  email: string
}

/** Cuenta de super-admin para la pantalla de gestión (más campos que el perfil). */
export interface PlatformAdminAccount {
  id: number
  name: string
  email: string
  active: boolean
  last_login_at: string | null
  created_at: string | null
}

export type TenantStatus = 'active' | 'suspended'
export type BillingState = 'active' | 'trial' | 'past_due' | 'canceled' | 'none'

export interface PlatformPlan {
  key: string
  name: string
  max_patients: number | null // null = ilimitado
  includes_app: boolean
}

/** Plan con todos los campos editables (pantalla de configuración de planes). */
export interface PlatformPlanFull extends PlatformPlan {
  id: number
  price_mxn: number | null
  stripe_price_id: string | null
  stripe_ready: boolean
  tenants_count: number
}

export interface TenantBilling {
  subscribed: boolean
  on_trial: boolean
  trial_ends_at: string | null
  status: string | null
  ends_at: string | null
  renews_at: string | null
  card_last_four: string | null
  invoices: Invoice[]
}

export interface TenantUsage {
  patients: number
  max_patients: number | null
  percent: number | null
}

export interface TenantContact {
  admin_name: string | null
  admin_email: string | null
  last_login_at: string | null
}

export interface TenantBillingLite {
  state: BillingState
  trial_ends_at: string | null
}

export interface PlatformTenant {
  id: number
  name: string
  slug: string
  brand_name: string
  status: TenantStatus
  plan: (PlatformPlan & { price_mxn?: number | null }) | null
  created_at: string | null
  counts?: { users: number; patients: number }
  usage?: TenantUsage
  contact?: TenantContact
  billing_lite?: TenantBillingLite
  billing?: TenantBilling
}

export interface PlatformStats {
  totals: { tenants: number; active: number; suspended: number; patients: number; users: number }
  by_plan: { key: string; name: string; count: number }[]
  by_subscription: { active: number; trial: number; past_due: number; canceled: number; none: number }
  growth: { month: string; label: string; new: number; total: number }[]
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function platformLogin(email: string, password: string): Promise<PlatformAdmin> {
  const { data } = await platformApi.post<{ token: string; data: PlatformAdmin }>(
    '/api/platform/auth/login',
    { email, password },
  )
  setPlatformToken(data.token)
  return data.data
}

export async function platformMe(): Promise<PlatformAdmin> {
  const { data } = await platformApi.get<ApiEnvelope<PlatformAdmin>>('/api/platform/me')
  return data.data
}

export async function platformLogout(): Promise<void> {
  try {
    await platformApi.post('/api/platform/auth/logout')
  } finally {
    setPlatformToken(null)
  }
}

// ── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<PlatformStats> {
  const { data } = await platformApi.get<ApiEnvelope<PlatformStats>>('/api/platform/stats')
  return data.data
}

// ── Clínicas ─────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<PlatformTenant[]> {
  const { data } = await platformApi.get<{ data: PlatformTenant[] }>('/api/platform/tenants')
  return data.data
}

export async function getTenant(id: number): Promise<PlatformTenant> {
  const { data } = await platformApi.get<ApiEnvelope<PlatformTenant>>(`/api/platform/tenants/${id}`)
  return data.data
}

export interface CreateTenantPayload {
  name: string
  slug?: string
  admin_email: string
  admin_name?: string
  plan_key?: string
}

export interface CreateTenantResult {
  tenant: PlatformTenant
  admin_password: string
}

export async function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResult> {
  const { data } = await platformApi.post<{ data: PlatformTenant; admin_password: string }>(
    '/api/platform/tenants',
    payload,
  )
  return { tenant: data.data, admin_password: data.admin_password }
}

export async function updateTenant(
  id: number,
  payload: { status?: TenantStatus; name?: string; plan_key?: string },
): Promise<PlatformTenant> {
  const { data } = await platformApi.patch<ApiEnvelope<PlatformTenant>>(
    `/api/platform/tenants/${id}`,
    payload,
  )
  return data.data
}

export async function deleteTenant(id: number, confirmSlug: string): Promise<void> {
  await platformApi.delete(`/api/platform/tenants/${id}`, {
    data: { confirm_slug: confirmSlug },
  })
}

export interface ResetAdminPasswordResult {
  admin_email: string
  admin_password: string
  email_sent: boolean
}

export async function resetTenantAdminPassword(id: number): Promise<ResetAdminPasswordResult> {
  const { data } = await platformApi.post<ResetAdminPasswordResult>(
    `/api/platform/tenants/${id}/reset-admin-password`,
  )
  return data
}

// ── Planes ───────────────────────────────────────────────────────────────────

export async function listPlans(): Promise<PlatformPlanFull[]> {
  const { data } = await platformApi.get<{ data: PlatformPlanFull[] }>('/api/platform/plans')
  return data.data
}

export interface UpdatePlanPayload {
  name?: string
  max_patients?: number | null
  includes_app?: boolean
  price_mxn?: number | null
  stripe_price_id?: string | null
}

export async function updatePlan(id: number, payload: UpdatePlanPayload): Promise<PlatformPlanFull> {
  const { data } = await platformApi.patch<ApiEnvelope<PlatformPlanFull>>(
    `/api/platform/plans/${id}`,
    payload,
  )
  return data.data
}

// ── Super-admins ─────────────────────────────────────────────────────────────

export async function listAdmins(): Promise<PlatformAdminAccount[]> {
  const { data } = await platformApi.get<{ data: PlatformAdminAccount[] }>('/api/platform/admins')
  return data.data
}

export interface CreateAdminPayload {
  name: string
  email: string
  password: string
  active?: boolean
}

export async function createAdmin(payload: CreateAdminPayload): Promise<PlatformAdminAccount> {
  const { data } = await platformApi.post<ApiEnvelope<PlatformAdminAccount>>(
    '/api/platform/admins',
    payload,
  )
  return data.data
}

export interface UpdateAdminPayload {
  name?: string
  email?: string
  password?: string
  active?: boolean
}

export async function updateAdmin(
  id: number,
  payload: UpdateAdminPayload,
): Promise<PlatformAdminAccount> {
  const { data } = await platformApi.patch<ApiEnvelope<PlatformAdminAccount>>(
    `/api/platform/admins/${id}`,
    payload,
  )
  return data.data
}

export async function deleteAdmin(id: number): Promise<void> {
  await platformApi.delete(`/api/platform/admins/${id}`)
}
