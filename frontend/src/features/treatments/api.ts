import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Treatment } from '@/shared/types/catalog'

export interface TreatmentQuery {
  q?: string
  category?: string
  only_active?: boolean
}

export async function listTreatments(query: TreatmentQuery = {}): Promise<Treatment[]> {
  const { data } = await api.get<{ data: Treatment[] }>('/api/treatments', { params: query })
  return data.data
}

export interface TreatmentPayload {
  code?: string | null
  name: string
  category?: string | null
  description?: string | null
  base_price: number
  duration_minutes: number
  commission_percent?: number | null
  commission_base?: 'price' | 'profit'
  cost?: number | null
  periodicity_days?: number | null
  recall_label?: string | null
  requires_consent_template_id?: number | null
  active?: boolean
}

export async function createTreatment(payload: TreatmentPayload): Promise<Treatment> {
  const { data } = await api.post<ApiEnvelope<Treatment>>('/api/treatments', payload)
  return data.data
}

export async function updateTreatment(id: number, payload: Partial<TreatmentPayload>): Promise<Treatment> {
  const { data } = await api.put<ApiEnvelope<Treatment>>(`/api/treatments/${id}`, payload)
  return data.data
}

export async function deleteTreatment(id: number): Promise<void> {
  await api.delete(`/api/treatments/${id}`)
}
