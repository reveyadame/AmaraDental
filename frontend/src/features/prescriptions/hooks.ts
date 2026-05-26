import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPrescription,
  createTemplate,
  deletePrescription,
  deleteTemplate,
  getPrescription,
  getTemplate,
  listPatientPrescriptions,
  listTemplates,
  updateTemplate,
  type PrescriptionPayload,
  type PrescriptionTemplatePayload,
} from './api'

const patientListKey = (patientId: number) =>
  ['patients', patientId, 'prescriptions'] as const
const itemKey = (id: number) => ['prescriptions', id] as const

export function usePrescriptions(patientId: number) {
  return useQuery({
    queryKey: patientListKey(patientId),
    queryFn: () => listPatientPrescriptions(patientId),
    staleTime: 30_000,
  })
}

export function usePrescription(id: number | undefined) {
  return useQuery({
    queryKey: id ? itemKey(id) : ['prescriptions', 'none'],
    queryFn: () => getPrescription(id as number),
    enabled: !!id,
  })
}

export function useCreatePrescription(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PrescriptionPayload) => createPrescription(patientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientListKey(patientId) })
    },
  })
}

export function useDeletePrescription(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deletePrescription(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientListKey(patientId) })
    },
  })
}

/* --- Plantillas --------------------------------------------------------- */

const templatesKey = (q?: string) => ['prescription-templates', q ?? ''] as const
const templateKey = (id: number) => ['prescription-templates', id] as const

export function useTemplates(q?: string) {
  return useQuery({
    queryKey: templatesKey(q),
    queryFn: () => listTemplates(q),
    staleTime: 60_000,
  })
}

export function useTemplate(id: number | undefined) {
  return useQuery({
    queryKey: id ? templateKey(id) : ['prescription-templates', 'none'],
    queryFn: () => getTemplate(id as number),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: PrescriptionTemplatePayload) => createTemplate(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescription-templates'] }),
  })
}

export function useUpdateTemplate(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<PrescriptionTemplatePayload>) => updateTemplate(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescription-templates'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prescription-templates'] }),
  })
}
