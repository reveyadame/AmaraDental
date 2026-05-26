import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSpecialist,
  deleteSpecialist,
  getSpecialistCommissions,
  listSpecialists,
  syncSpecialistCommissions,
  updateSpecialist,
  type CommissionOverride,
  type SpecialistPayload,
} from './api'

const key = (q?: string) => ['specialists', q ?? ''] as const
const commissionsKey = (id: number) => ['specialists', id, 'commissions'] as const

export function useSpecialists(q?: string) {
  return useQuery({
    queryKey: key(q),
    queryFn: () => listSpecialists(q),
    staleTime: 60_000,
  })
}

export function useCreateSpecialist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SpecialistPayload) => createSpecialist(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialists'] }),
  })
}

export function useUpdateSpecialist(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: SpecialistPayload) => updateSpecialist(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialists'] }),
  })
}

export function useDeleteSpecialist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteSpecialist(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialists'] }),
  })
}

export function useSpecialistCommissions(specialistId: number | undefined) {
  return useQuery({
    queryKey: specialistId ? commissionsKey(specialistId) : ['specialist-commissions', 'none'],
    queryFn: () => getSpecialistCommissions(specialistId as number),
    enabled: !!specialistId,
  })
}

export function useSyncSpecialistCommissions(specialistId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (overrides: CommissionOverride[]) =>
      syncSpecialistCommissions(specialistId, overrides),
    onSuccess: (data) => {
      qc.setQueryData(commissionsKey(specialistId), data)
    },
  })
}
