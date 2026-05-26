import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getOdontogram, updateTooth } from './odontogramApi'
import type { ToothState, UpdateToothStatePayload } from '@/shared/types/odontogram'

const key = (patientId: number) => ['patients', patientId, 'odontogram'] as const

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
