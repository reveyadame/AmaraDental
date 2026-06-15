import { platformApi, setPlatformToken } from '@/shared/api/platform-client'
import type { ApiEnvelope } from '@/shared/types/api'

export interface PlatformAdmin {
  id: number
  name: string
  email: string
}

export type TenantStatus = 'active' | 'suspended'

export interface PlatformPlan {
  key: string
  name: string
  max_patients: number | null // null = ilimitado
  includes_app: boolean
}

export interface PlatformTenant {
  id: number
  name: string
  slug: string
  brand_name: string
  status: TenantStatus
  plan: PlatformPlan | null
  created_at: string | null
  counts?: { users: number; patients: number }
}

export async function listPlans(): Promise<PlatformPlan[]> {
  const { data } = await platformApi.get<{ data: PlatformPlan[] }>('/api/platform/plans')
  return data.data
}

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

export async function listTenants(): Promise<PlatformTenant[]> {
  const { data } = await platformApi.get<{ data: PlatformTenant[] }>('/api/platform/tenants')
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
