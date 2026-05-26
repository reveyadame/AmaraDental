import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  Consent,
  ConsentTemplate,
  MedicalHistory,
  Paginated,
  Patient,
} from '@/shared/types/patient'

export interface PatientListQuery {
  q?: string
  only_active?: boolean
  page?: number
  per_page?: number
}

export async function listPatients(query: PatientListQuery): Promise<Paginated<Patient>> {
  const { data } = await api.get<Paginated<Patient>>('/api/patients', { params: query })
  return data
}

export async function getPatient(id: number): Promise<Patient> {
  const { data } = await api.get<ApiEnvelope<Patient>>(`/api/patients/${id}`)
  return data.data
}

export interface PatientFormPayload {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'M' | 'F' | 'Otro'
  curp?: string | null
  rfc?: string | null
  email?: string | null
  phone?: string | null
  mobile_phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  occupation?: string | null
  referred_by?: string | null
  notes?: string | null
  active?: boolean
}

export async function createPatient(payload: PatientFormPayload): Promise<Patient> {
  const { data } = await api.post<ApiEnvelope<Patient>>('/api/patients', payload)
  return data.data
}

export async function updatePatient(id: number, payload: Partial<PatientFormPayload>): Promise<Patient> {
  const { data } = await api.put<ApiEnvelope<Patient>>(`/api/patients/${id}`, payload)
  return data.data
}

export async function deletePatient(id: number): Promise<void> {
  await api.delete(`/api/patients/${id}`)
}

export async function getMedicalHistory(patientId: number): Promise<MedicalHistory> {
  const { data } = await api.get<ApiEnvelope<MedicalHistory>>(
    `/api/patients/${patientId}/medical-history`,
  )
  return data.data
}

export async function updateMedicalHistory(
  patientId: number,
  payload: Partial<MedicalHistory>,
): Promise<MedicalHistory> {
  const { data } = await api.put<ApiEnvelope<MedicalHistory>>(
    `/api/patients/${patientId}/medical-history`,
    payload,
  )
  return data.data
}

export async function listConsents(patientId: number): Promise<Consent[]> {
  const { data } = await api.get<{ data: Consent[] }>(`/api/patients/${patientId}/consents`)
  return data.data
}

export async function getConsent(patientId: number, consentId: number): Promise<Consent> {
  const { data } = await api.get<ApiEnvelope<Consent>>(
    `/api/patients/${patientId}/consents/${consentId}`,
  )
  return data.data
}

export interface ConsentCreatePayload {
  consent_template_id?: number | null
  title: string
  body: string
  signature_image: string
  signed_by_name: string
}

export async function createConsent(
  patientId: number,
  payload: ConsentCreatePayload,
): Promise<Consent> {
  const { data } = await api.post<ApiEnvelope<Consent>>(
    `/api/patients/${patientId}/consents`,
    payload,
  )
  return data.data
}

export async function deleteConsent(patientId: number, consentId: number): Promise<void> {
  await api.delete(`/api/patients/${patientId}/consents/${consentId}`)
}

export async function listConsentTemplates(): Promise<ConsentTemplate[]> {
  const { data } = await api.get<{ data: ConsentTemplate[] }>('/api/consent-templates')
  return data.data
}
