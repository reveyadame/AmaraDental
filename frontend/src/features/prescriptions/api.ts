import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Prescription, PrescriptionTemplate } from '@/shared/types/prescription'

export async function listPatientPrescriptions(patientId: number): Promise<Prescription[]> {
  const { data } = await api.get<{ data: Prescription[] }>(
    `/api/patients/${patientId}/prescriptions`,
  )
  return data.data
}

export async function getPrescription(id: number): Promise<Prescription> {
  const { data } = await api.get<ApiEnvelope<Prescription>>(`/api/prescriptions/${id}`)
  return data.data
}

export interface PrescriptionItemPayload {
  medication: string
  presentation?: string | null
  dosage: string
  route?: string | null
  frequency: string
  duration: string
  instructions?: string | null
}

export interface PrescriptionPayload {
  specialist_id: number
  appointment_id?: number | null
  diagnosis?: string | null
  notes?: string | null
  issued_at?: string | null
  items: PrescriptionItemPayload[]
}

export async function createPrescription(
  patientId: number,
  payload: PrescriptionPayload,
): Promise<Prescription> {
  const { data } = await api.post<ApiEnvelope<Prescription>>(
    `/api/patients/${patientId}/prescriptions`,
    payload,
  )
  return data.data
}

export async function deletePrescription(id: number): Promise<void> {
  await api.delete(`/api/prescriptions/${id}`)
}

/* --- Plantillas de recetas ---------------------------------------------- */

export async function listTemplates(q?: string): Promise<PrescriptionTemplate[]> {
  const { data } = await api.get<{ data: PrescriptionTemplate[] }>(
    '/api/prescription-templates',
    { params: q ? { q } : {} },
  )
  return data.data
}

export async function getTemplate(id: number): Promise<PrescriptionTemplate> {
  const { data } = await api.get<ApiEnvelope<PrescriptionTemplate>>(
    `/api/prescription-templates/${id}`,
  )
  return data.data
}

export interface PrescriptionTemplatePayload {
  name: string
  category?: string | null
  description?: string | null
  active?: boolean
  items: PrescriptionItemPayload[]
}

export async function createTemplate(
  payload: PrescriptionTemplatePayload,
): Promise<PrescriptionTemplate> {
  const { data } = await api.post<ApiEnvelope<PrescriptionTemplate>>(
    '/api/prescription-templates',
    payload,
  )
  return data.data
}

export async function updateTemplate(
  id: number,
  payload: Partial<PrescriptionTemplatePayload>,
): Promise<PrescriptionTemplate> {
  const { data } = await api.put<ApiEnvelope<PrescriptionTemplate>>(
    `/api/prescription-templates/${id}`,
    payload,
  )
  return data.data
}

export async function deleteTemplate(id: number): Promise<void> {
  await api.delete(`/api/prescription-templates/${id}`)
}
