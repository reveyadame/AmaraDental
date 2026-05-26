import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTreatment,
  deleteTreatment,
  listTreatments,
  updateTreatment,
  type TreatmentPayload,
  type TreatmentQuery,
} from './api'

const key = (q?: TreatmentQuery) => ['treatments', q ?? {}] as const

export function useTreatments(query: TreatmentQuery = {}) {
  return useQuery({
    queryKey: key(query),
    queryFn: () => listTreatments(query),
    staleTime: 60_000,
  })
}

export function useCreateTreatment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: TreatmentPayload) => createTreatment(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatments'] }),
  })
}

export function useUpdateTreatment(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<TreatmentPayload>) => updateTreatment(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatments'] }),
  })
}

export function useDeleteTreatment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteTreatment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatments'] }),
  })
}
