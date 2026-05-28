import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addTreatmentLogEntry,
  deleteTreatmentLogEntry,
  getOdontogram,
  getTreatmentLog,
  updateOdontogramDiagnosis,
  updateTooth,
} from './odontogramApi'
import type { OdontogramResponse } from '@/shared/types/odontogram'
import type {
  CreateTreatmentLogPayload,
  ToothState,
  UpdateToothStatePayload,
} from '@/shared/types/odontogram'

const key = (patientId: number) => ['patients', patientId, 'odontogram'] as const
const logKey = (patientId: number) =>
  ['patients', patientId, 'treatment-log'] as const

export function useOdontogram(patientId: number) {
  return useQuery({
    queryKey: key(patientId),
    queryFn: () => getOdontogram(patientId),
    staleTime: 60_000,
  })
}

export function useUpdateTooth(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      toothNumber,
      payload,
    }: {
      toothNumber: number
      payload: UpdateToothStatePayload
    }) => updateTooth(patientId, toothNumber, payload),
    onSuccess: (updated) => {
      const k = key(patientId)
      qc.setQueryData(k, (prev: { data: ToothState[]; meta: unknown } | undefined) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.map((t) =>
            t.tooth_number === updated.tooth_number ? updated : t,
          ),
        }
      })
    },
  })
}

export function useUpdateOdontogramDiagnosis(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (diagnosis: string | null) =>
      updateOdontogramDiagnosis(patientId, diagnosis),
    onSuccess: (general_diagnosis) => {
      qc.setQueryData(
        key(patientId),
        (prev: OdontogramResponse | undefined) =>
          prev ? { ...prev, meta: { ...prev.meta, general_diagnosis } } : prev,
      )
    },
  })
}

export function useTreatmentLog(patientId: number) {
  return useQuery({
    queryKey: logKey(patientId),
    queryFn: () => getTreatmentLog(patientId),
    staleTime: 30_000,
  })
}

export function useAddTreatmentLogEntry(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTreatmentLogPayload) =>
      addTreatmentLogEntry(patientId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: logKey(patientId) }),
  })
}

export function useDeleteTreatmentLogEntry(patientId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entryId: number) => deleteTreatmentLogEntry(patientId, entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: logKey(patientId) }),
  })
}
