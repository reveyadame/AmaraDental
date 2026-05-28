import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createEndodonticRecord,
  deleteEndodonticRecord,
  listEndodonticRecords,
  updateEndodonticRecord,
} from './endodonticsApi'
import type { EndodonticRecordPayload } from '@/shared/types/endodontics'

const key = (patientId: number) =>
  ['patients', patientId, 'endodontic-records'] as const

export function useEndodonticRecords(patientId: number) {
  return useQuery({
    queryKey: key(patientId),
    queryFn: () => listEndodonticRecords(patientId),
    staleTime: 30_000,
  })
}

export function useSaveEndodonticRecord(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | null
      payload: EndodonticRecordPayload
    }) =>
      id
        ? updateEndodonticRecord(patientId, id, payload)
        : createEndodonticRecord(patientId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  })
}

export function useDeleteEndodonticRecord(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: number) =>
      deleteEndodonticRecord(patientId, recordId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  })
}
