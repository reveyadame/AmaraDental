import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCommissionPayment,
  deleteCommissionPayment,
  getCommissionPayment,
  listCommissionPayments,
  listPendingCommissions,
  type CommissionPaymentListQuery,
  type CommissionPaymentPayload,
  type PendingQuery,
} from './api'

export function usePendingCommissions(q: PendingQuery = {}) {
  return useQuery({
    queryKey: ['commissions', 'pending', q],
    queryFn: () => listPendingCommissions(q),
    staleTime: 30_000,
  })
}

export function useCommissionPayments(q: CommissionPaymentListQuery = {}) {
  return useQuery({
    queryKey: ['commissions', 'payments', q],
    queryFn: () => listCommissionPayments(q),
    staleTime: 30_000,
  })
}

export function useCommissionPayment(id: number | undefined) {
  return useQuery({
    queryKey: id ? ['commissions', 'payment', id] : ['commissions', 'payment', 'none'],
    queryFn: () => getCommissionPayment(id as number),
    enabled: !!id,
  })
}

export function useCreateCommissionPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: CommissionPaymentPayload) => createCommissionPayment(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commissions'] })
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}

export function useDeleteCommissionPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCommissionPayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commissions'] })
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}
