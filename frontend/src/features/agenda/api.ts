import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  AgendaBlock,
  Appointment,
  AppointmentStatus,
  IcsFeedInfo,
} from '@/shared/types/agenda'

export interface AppointmentQuery {
  date_from?: string
  date_to?: string
  specialist_id?: number
  patient_id?: number
  status?: AppointmentStatus
}

export async function listAppointments(q: AppointmentQuery): Promise<Appointment[]> {
  const { data } = await api.get<{ data: Appointment[] }>('/api/appointments', {
    params: q,
  })
  return data.data
}

export async function getAppointment(id: number): Promise<Appointment> {
  const { data } = await api.get<ApiEnvelope<Appointment>>(`/api/appointments/${id}`)
  return data.data
}

export interface AppointmentPayload {
  patient_id: number
  specialist_id: number
  treatment_id?: number | null
  title?: string | null
  notes?: string | null
  starts_at: string
  ends_at: string
  room?: string | null
  status?: AppointmentStatus
}

export async function createAppointment(p: AppointmentPayload): Promise<Appointment> {
  const { data } = await api.post<ApiEnvelope<Appointment>>('/api/appointments', p)
  return data.data
}

export async function updateAppointment(
  id: number,
  p: Partial<AppointmentPayload>,
): Promise<Appointment> {
  const { data } = await api.put<ApiEnvelope<Appointment>>(`/api/appointments/${id}`, p)
  return data.data
}

export async function changeAppointmentStatus(
  id: number,
  status: AppointmentStatus,
): Promise<Appointment> {
  const { data } = await api.post<ApiEnvelope<Appointment>>(
    `/api/appointments/${id}/status`,
    { status },
  )
  return data.data
}

export async function deleteAppointment(id: number): Promise<void> {
  await api.delete(`/api/appointments/${id}`)
}

export async function getIcsFeedToken(): Promise<IcsFeedInfo | null> {
  const { data } = await api.get<{ data: IcsFeedInfo | null }>('/api/agenda/feed-token')
  return data.data
}

export async function regenerateIcsFeedToken(): Promise<IcsFeedInfo> {
  const { data } = await api.post<ApiEnvelope<IcsFeedInfo>>('/api/agenda/feed-token')
  return data.data
}

export interface AgendaBlockQuery {
  date_from?: string
  date_to?: string
  specialist_id?: number
}

export interface AgendaBlockPayload {
  specialist_id?: number | null
  starts_at: string
  ends_at: string
  all_day?: boolean
  title: string
  notes?: string | null
}

export async function listAgendaBlocks(q: AgendaBlockQuery): Promise<AgendaBlock[]> {
  const { data } = await api.get<{ data: AgendaBlock[] }>('/api/agenda-blocks', {
    params: q,
  })
  return data.data
}

export async function createAgendaBlock(p: AgendaBlockPayload): Promise<AgendaBlock> {
  const { data } = await api.post<ApiEnvelope<AgendaBlock>>('/api/agenda-blocks', p)
  return data.data
}

export async function updateAgendaBlock(
  id: number,
  p: Partial<AgendaBlockPayload>,
): Promise<AgendaBlock> {
  const { data } = await api.put<ApiEnvelope<AgendaBlock>>(
    `/api/agenda-blocks/${id}`,
    p,
  )
  return data.data
}

export async function deleteAgendaBlock(id: number): Promise<void> {
  await api.delete(`/api/agenda-blocks/${id}`)
}
