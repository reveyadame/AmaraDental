import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteRecall,
  getRecall,
  listRecalls,
  updateRecall,
  type RecallListQuery,
  type RecallUpdatePayload,
} from './api'

const listKey = (q: RecallListQuery) => ['recalls', q] as const
const itemKey = (id: number) => ['recalls', id] as const

export function useRecalls(query: RecallListQuery = {}) {
  return useQuery({
    queryKey: listKey(query),
    queryFn: () => listRecalls(query),
    staleTime: 30_000,
  })
}

export function useRecall(id: number | undefined) {
  return useQuery({
    queryKey: id ? itemKey(id) : ['recalls', 'none'],
    queryFn: () => getRecall(id as number),
    enabled: !!id,
  })
}

export function useUpdateRecall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecallUpdatePayload }) =>
      updateRecall(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recalls'] }),
  })
}

export function useDeleteRecall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteRecall(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recalls'] }),
  })
}
