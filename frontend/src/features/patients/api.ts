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

// ── Portal de pacientes (app móvil) ──────────────────────────────────────────

export interface PortalAccess {
  patient_id: number
  has_access: boolean
  status: 'pending' | 'active' | 'blocked' | null
  identifier: string | null
  last_login_at: string | null
}

export async function getPortalAccess(patientId: number): Promise<PortalAccess> {
  const { data } = await api.get<ApiEnvelope<PortalAccess>>(`/api/patients/${patientId}/portal`)
  return data.data
}

export async function invitePortal(patientId: number): Promise<PortalAccess> {
  const { data } = await api.post<ApiEnvelope<PortalAccess>>(
    `/api/patients/${patientId}/portal/invite`,
  )
  return data.data
}

export async function revokePortal(patientId: number): Promise<void> {
  await api.delete(`/api/patients/${patientId}/portal`)
}

export interface PatientFormPayload {
  first_name: string
  last_name: string
  /** Obligatorio salvo en alta rápida desde agenda (is_first_visit=true). */
  date_of_birth?: string | null
  /** Obligatorio salvo en alta rápida desde agenda (is_first_visit=true). */
  gender?: 'M' | 'F' | 'Otro' | null
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
  /** Marca al paciente como "primera vez" sin expediente completo. */
  is_first_visit?: boolean
}

export interface QuickPatientPayload {
  first_name: string
  last_name: string
  mobile_phone?: string | null
  phone?: string | null
  notes?: string | null
}

export async function createQuickPatient(payload: QuickPatientPayload): Promise<Patient> {
  const { data } = await api.post<ApiEnvelope<Patient>>('/api/patients', {
    ...payload,
    is_first_visit: true,
  })
  return data.data
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

/** Categorías de registros que pueden bloquear la eliminación de un paciente. */
export type PatientBlockerKey =
  | 'appointments'
  | 'charges'
  | 'quotes'
  | 'prescriptions'
  | 'consents'
  | 'memberships'
  | 'lab_orders'
  | 'recalls'
  | 'tooth_states'
  | 'dental_treatment_logs'
  | 'endodontic_records'

export interface PatientDeletePreview {
  can_delete: boolean
  blockers: Partial<Record<PatientBlockerKey, number>>
}

export async function getPatientDeletePreview(id: number): Promise<PatientDeletePreview> {
  const { data } = await api.get<ApiEnvelope<PatientDeletePreview>>(
    `/api/patients/${id}/delete-preview`,
  )
  return data.data
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
