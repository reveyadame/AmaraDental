import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeLabOrderStatus,
  createLab,
  createLabOrder,
  deleteLab,
  deleteLabOrder,
  getLabOrder,
  listLabOrders,
  listLabs,
  updateLab,
  updateLabOrder,
  type LabOrderListQuery,
  type LabOrderPayload,
  type LabPayload,
} from './api'
import type { LabOrderStatus } from '@/shared/types/lab'

const listKey = (q: LabOrderListQuery) => ['lab-orders', q] as const
const itemKey = (id: number) => ['lab-orders', id] as const

export function useLabOrders(query: LabOrderListQuery = {}) {
  return useQuery({
    queryKey: listKey(query),
    queryFn: () => listLabOrders(query),
    staleTime: 30_000,
  })
}

export function useLabOrder(id: number | undefined) {
  return useQuery({
    queryKey: id ? itemKey(id) : ['lab-orders', 'none'],
    queryFn: () => getLabOrder(id as number),
    enabled: !!id,
  })
}

export function useCreateLabOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: LabOrderPayload) => createLabOrder(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

export function useUpdateLabOrder(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<LabOrderPayload>) => updateLabOrder(id, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-orders'] })
      qc.invalidateQueries({ queryKey: itemKey(id) })
    },
  })
}

export function useChangeLabOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: LabOrderStatus }) =>
      changeLabOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

export function useDeleteLabOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLabOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lab-orders'] }),
  })
}

export function useLabs(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['labs', params],
    queryFn: () => listLabs(params),
    staleTime: 60_000,
  })
}

export function useCreateLab() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: LabPayload) => createLab(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })
}

export function useUpdateLab(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<LabPayload>) => updateLab(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })
}

export function useDeleteLab() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteLab(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labs'] }),
  })
}
