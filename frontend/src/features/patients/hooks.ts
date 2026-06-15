import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  createConsent,
  createPatient,
  createQuickPatient,
  deleteConsent,
  deletePatient,
  getConsent,
  getMedicalHistory,
  getPatient,
  getPatientDeletePreview,
  getPortalAccess,
  invitePortal,
  listConsentTemplates,
  listConsents,
  listPatients,
  revokePortal,
  updateMedicalHistory,
  updatePatient,
  type ConsentCreatePayload,
  type PatientFormPayload,
  type PatientListQuery,
  type QuickPatientPayload,
} from './api'
import type { MedicalHistory } from '@/shared/types/patient'

const patientsKey = (q: PatientListQuery) => ['patients', q] as const
const patientKey = (id: number) => ['patients', id] as const
const medicalHistoryKey = (id: number) => ['patients', id, 'medical-history'] as const
const consentsKey = (id: number) => ['patients', id, 'consents'] as const
const templatesKey = ['consent-templates'] as const
const portalKey = (id: number) => ['patients', id, 'portal'] as const

export function usePortalAccess(patientId: number, enabled = true) {
  return useQuery({
    queryKey: portalKey(patientId),
    queryFn: () => getPortalAccess(patientId),
    enabled,
  })
}

export function useInvitePortal(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => invitePortal(patientId),
    onSuccess: (access) => qc.setQueryData(portalKey(patientId), access),
  })
}

export function useRevokePortal(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => revokePortal(patientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: portalKey(patientId) }),
  })
}

export function usePatients(query: PatientListQuery) {
  return useQuery({
    queryKey: patientsKey(query),
    queryFn: () => listPatients(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function usePatient(id: number | undefined) {
  return useQuery({
    queryKey: id ? patientKey(id) : ['patients', 'none'],
    queryFn: () => getPatient(id as number),
    enabled: !!id,
  })
}

export function useCreatePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PatientFormPayload) => createPatient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

/** Alta rápida desde agenda con solo nombre + teléfono. */
export function useCreateQuickPatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuickPatientPayload) => createQuickPatient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

export function useUpdatePatient(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<PatientFormPayload>) => updatePatient(id, payload),
    onSuccess: (p) => {
      qc.setQueryData(patientKey(id), p)
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

export function useDeletePatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePatient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  })
}

/**
 * Pre-check de eliminación: lista de tablas con registros que bloquean.
 * Solo el admin tiene autorización en el backend; para otros usuarios
 * el endpoint devuelve 403 y el query queda en error.
 */
export function usePatientDeletePreview(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: id
      ? (['patients', id, 'delete-preview'] as const)
      : (['patients', 'none', 'delete-preview'] as const),
    queryFn: () => getPatientDeletePreview(id as number),
    enabled: !!id && enabled,
    staleTime: 10_000,
  })
}

export function useMedicalHistory(patientId: number) {
  return useQuery({
    queryKey: medicalHistoryKey(patientId),
    queryFn: () => getMedicalHistory(patientId),
  })
}

export function useUpdateMedicalHistory(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<MedicalHistory>) => updateMedicalHistory(patientId, payload),
    onSuccess: (h) => {
      qc.setQueryData(medicalHistoryKey(patientId), h)
      qc.invalidateQueries({ queryKey: patientKey(patientId) })
    },
  })
}

export function useConsents(patientId: number) {
  return useQuery({
    queryKey: consentsKey(patientId),
    queryFn: () => listConsents(patientId),
  })
}

export function useConsent(patientId: number, consentId: number | undefined) {
  return useQuery({
    queryKey: consentId ? ([...consentsKey(patientId), consentId] as const) : ['consent', 'none'],
    queryFn: () => getConsent(patientId, consentId as number),
    enabled: !!consentId,
  })
}

export function useCreateConsent(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConsentCreatePayload) => createConsent(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: consentsKey(patientId) })
      qc.invalidateQueries({ queryKey: patientKey(patientId) })
    },
  })
}

export function useDeleteConsent(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (consentId: number) => deleteConsent(patientId, consentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: consentsKey(patientId) }),
  })
}

export function useConsentTemplates() {
  return useQuery({
    queryKey: templatesKey,
    queryFn: listConsentTemplates,
    staleTime: 5 * 60_000,
  })
}
