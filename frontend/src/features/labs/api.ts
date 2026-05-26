import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Lab, LabOrder, LabOrderStatus } from '@/shared/types/lab'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface LabOrderListQuery {
  status?: string
  patient_id?: number
  dentist_user_id?: number
  q?: string
  overdue?: boolean
  page?: number
  per_page?: number
}

export interface LabOrderPayload {
  patient_id: number
  treatment_id?: number | null
  dentist_user_id?: number | null
  lab_name: string
  work_type?: string | null
  specifications?: string | null
  sent_on?: string | null
  due_on?: string | null
  received_on?: string | null
  delivered_to_patient_on?: string | null
  cost?: number | null
  status?: LabOrderStatus
  notes?: string | null
}

export async function listLabOrders(query: LabOrderListQuery = {}): Promise<{
  data: LabOrder[]
  meta: PaginatedMeta
}> {
  const { data } = await api.get<{ data: LabOrder[]; meta: PaginatedMeta }>(
    '/api/lab-orders',
    { params: query },
  )
  return data
}

export async function getLabOrder(id: number): Promise<LabOrder> {
  const { data } = await api.get<ApiEnvelope<LabOrder>>(`/api/lab-orders/${id}`)
  return data.data
}

export async function createLabOrder(payload: LabOrderPayload): Promise<LabOrder> {
  const { data } = await api.post<ApiEnvelope<LabOrder>>('/api/lab-orders', payload)
  return data.data
}

export async function updateLabOrder(
  id: number,
  payload: Partial<LabOrderPayload>,
): Promise<LabOrder> {
  const { data } = await api.put<ApiEnvelope<LabOrder>>(
    `/api/lab-orders/${id}`,
    payload,
  )
  return data.data
}

export async function changeLabOrderStatus(
  id: number,
  status: LabOrderStatus,
): Promise<LabOrder> {
  const { data } = await api.post<ApiEnvelope<LabOrder>>(
    `/api/lab-orders/${id}/status`,
    { status },
  )
  return data.data
}

export async function deleteLabOrder(id: number): Promise<void> {
  await api.delete(`/api/lab-orders/${id}`)
}

export interface LabPayload {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  active?: boolean
}

export async function listLabs(params: Record<string, unknown> = {}): Promise<Lab[]> {
  const { data } = await api.get<{ data: Lab[] }>('/api/labs', { params })
  return data.data
}

export async function createLab(payload: LabPayload): Promise<Lab> {
  const { data } = await api.post<ApiEnvelope<Lab>>('/api/labs', payload)
  return data.data
}

export async function updateLab(
  id: number,
  payload: Partial<LabPayload>,
): Promise<Lab> {
  const { data } = await api.put<ApiEnvelope<Lab>>(`/api/labs/${id}`, payload)
  return data.data
}

export async function deleteLab(id: number): Promise<void> {
  await api.delete(`/api/labs/${id}`)
}
