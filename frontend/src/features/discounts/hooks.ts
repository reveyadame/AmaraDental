import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createDiscount,
  deleteDiscount,
  listDiscounts,
  updateDiscount,
  type DiscountPayload,
} from './api'

const key = ['discounts'] as const

export function useDiscounts() {
  return useQuery({ queryKey: key, queryFn: listDiscounts, staleTime: 60_000 })
}

export function useCreateDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: DiscountPayload) => createDiscount(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useUpdateDiscount(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<DiscountPayload>) => updateDiscount(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}

export function useDeleteDiscount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDiscount(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
}
