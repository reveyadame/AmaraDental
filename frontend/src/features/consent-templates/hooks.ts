import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createConsentTemplate,
  deleteConsentTemplate,
  listAllConsentTemplates,
  updateConsentTemplate,
  type ConsentTemplatePayload,
} from './api'

// La clave comparte raíz con la lista activa (`['consent-templates']`) que usa
// el flujo de firma del paciente, así una invalidación refresca ambas.
const allKey = ['consent-templates', 'all'] as const

export function useConsentTemplatesCatalog() {
  return useQuery({
    queryKey: allKey,
    queryFn: listAllConsentTemplates,
    staleTime: 60_000,
  })
}

export function useCreateConsentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConsentTemplatePayload) => createConsentTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consent-templates'] }),
  })
}

export function useUpdateConsentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConsentTemplatePayload }) =>
      updateConsentTemplate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consent-templates'] }),
  })
}

export function useDeleteConsentTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteConsentTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consent-templates'] }),
  })
}
