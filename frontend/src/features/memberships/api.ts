import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Membership, MembershipPlan } from '@/shared/types/membership'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface MembershipPlanTreatmentPayload {
  treatment_id: number
  discount_percent?: number | null
  annual_quota?: number | null
}

export interface MembershipPlanPayload {
  name: string
  description?: string | null
  annual_price: number
  valid_months: number
  default_discount_percent?: number | null
  active?: boolean
  treatments?: MembershipPlanTreatmentPayload[]
}

export async function listMembershipPlans(params: Record<string, unknown> = {}): Promise<
  MembershipPlan[]
> {
  const { data } = await api.get<{ data: MembershipPlan[] }>('/api/membership-plans', {
    params,
  })
  return data.data
}

export async function getMembershipPlan(id: number): Promise<MembershipPlan> {
  const { data } = await api.get<ApiEnvelope<MembershipPlan>>(`/api/membership-plans/${id}`)
  return data.data
}

export async function createMembershipPlan(
  payload: MembershipPlanPayload,
): Promise<MembershipPlan> {
  const { data } = await api.post<ApiEnvelope<MembershipPlan>>(
    '/api/membership-plans',
    payload,
  )
  return data.data
}

export async function updateMembershipPlan(
  id: number,
  payload: Partial<MembershipPlanPayload>,
): Promise<MembershipPlan> {
  const { data } = await api.put<ApiEnvelope<MembershipPlan>>(
    `/api/membership-plans/${id}`,
    payload,
  )
  return data.data
}

export async function deleteMembershipPlan(id: number): Promise<void> {
  await api.delete(`/api/membership-plans/${id}`)
}

export interface MembershipListQuery {
  status?: string
  patient_id?: number
  expiring_soon?: boolean
  page?: number
  per_page?: number
}

export async function listMemberships(query: MembershipListQuery = {}): Promise<{
  data: Membership[]
  meta: PaginatedMeta
}> {
  const { data } = await api.get<{ data: Membership[]; meta: PaginatedMeta }>(
    '/api/memberships',
    { params: query },
  )
  return data
}

export interface CreateMembershipPayload {
  patient_id: number
  membership_plan_id: number
  starts_on: string
  ends_on?: string | null
  price_paid?: number | null
  notes?: string | null
  create_charge?: boolean
}

export async function createMembership(
  payload: CreateMembershipPayload,
): Promise<Membership> {
  const { data } = await api.post<ApiEnvelope<Membership>>('/api/memberships', payload)
  return data.data
}

export async function cancelMembership(id: number): Promise<Membership> {
  const { data } = await api.post<ApiEnvelope<Membership>>(
    `/api/memberships/${id}/cancel`,
  )
  return data.data
}

export async function getCurrentMembershipForPatient(
  patientId: number,
): Promise<Membership | null> {
  const { data } = await api.get<{ data: Membership | null }>(
    `/api/patients/${patientId}/membership`,
  )
  return data.data
}
