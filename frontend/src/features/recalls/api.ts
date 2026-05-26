import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Recall, RecallStatus } from '@/shared/types/recall'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type RecallWindow = 'overdue' | 'this_week' | 'next_30' | 'upcoming'

export interface RecallListQuery {
  status?: string
  window?: RecallWindow
  patient_id?: number
  page?: number
  per_page?: number
}

export interface RecallUpdatePayload {
  due_on?: string
  status?: RecallStatus
  scheduled_appointment_id?: number | null
  notes?: string | null
}

export async function listRecalls(query: RecallListQuery = {}): Promise<{
  data: Recall[]
  meta: PaginatedMeta
}> {
  const { data } = await api.get<{ data: Recall[]; meta: PaginatedMeta }>(
    '/api/recalls',
    { params: query },
  )
  return data
}

export async function getRecall(id: number): Promise<Recall> {
  const { data } = await api.get<ApiEnvelope<Recall>>(`/api/recalls/${id}`)
  return data.data
}

export async function updateRecall(
  id: number,
  payload: RecallUpdatePayload,
): Promise<Recall> {
  const { data } = await api.patch<ApiEnvelope<Recall>>(
    `/api/recalls/${id}`,
    payload,
  )
  return data.data
}

export async function deleteRecall(id: number): Promise<void> {
  await api.delete(`/api/recalls/${id}`)
}
