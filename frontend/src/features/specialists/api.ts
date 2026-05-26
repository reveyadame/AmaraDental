import { api } from '@/shared/api/client'
import type { ApiEnvelope, Specialist } from '@/shared/types/api'

export async function listSpecialists(q?: string): Promise<Specialist[]> {
  const { data } = await api.get<{ data: Specialist[] }>('/api/specialists', {
    params: { q: q || undefined },
  })
  return data.data
}

export interface SpecialistPayload {
  name?: string
  cedula_profesional?: string | null
  specialty?: string | null
  default_commission_percent?: number | null
  bio?: string | null
  active?: boolean
}

export async function createSpecialist(payload: SpecialistPayload): Promise<Specialist> {
  const { data } = await api.post<ApiEnvelope<Specialist>>('/api/specialists', payload)
  return data.data
}

export async function updateSpecialist(
  id: number,
  payload: SpecialistPayload,
): Promise<Specialist> {
  const { data } = await api.put<ApiEnvelope<Specialist>>(`/api/specialists/${id}`, payload)
  return data.data
}

export async function deleteSpecialist(id: number): Promise<void> {
  await api.delete(`/api/specialists/${id}`)
}

export type CommissionSource = 'override' | 'treatment' | 'specialist' | null

export interface SpecialistCommissionRow {
  treatment_id: number
  treatment_code: string | null
  treatment_name: string
  treatment_category: string | null
  treatment_default_percent: number | null
  specialist_default_percent: number | null
  override_percent: number | null
  effective_percent: number | null
  source: CommissionSource
}

export interface SpecialistCommissionsResponse {
  data: SpecialistCommissionRow[]
  meta: {
    specialist_id: number
    specialist_default_percent: number | null
  }
}

export async function getSpecialistCommissions(
  specialistId: number,
): Promise<SpecialistCommissionsResponse> {
  const { data } = await api.get<SpecialistCommissionsResponse>(
    `/api/specialists/${specialistId}/commissions`,
  )
  return data
}

export interface CommissionOverride {
  treatment_id: number
  commission_percent: number | null
}

export async function syncSpecialistCommissions(
  specialistId: number,
  overrides: CommissionOverride[],
): Promise<SpecialistCommissionsResponse> {
  const { data } = await api.put<SpecialistCommissionsResponse>(
    `/api/specialists/${specialistId}/commissions`,
    { overrides },
  )
  return data
}
