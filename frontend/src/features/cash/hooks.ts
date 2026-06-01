import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addPayment,
  cancelCharge,
  closeSession,
  createCashExpense,
  createCharge,
  deleteCashExpense,
  getCharge,
  getCurrentSession,
  getPatientAccount,
  getSession,
  listCashExpenses,
  listCashMovements,
  listCashSessionMovements,
  listCharges,
  listSessions,
  openSession,
  type CashExpensePayload,
  type CashMovementsFilters,
  type CashMovementsQuery,
  type ChargeCreatePayload,
  type ChargeListQuery,
  type ChargePaymentPayload,
  type CloseSessionPayload,
} from './api'

const sessionKey = ['cash-sessions', 'current'] as const
const chargesKey = (q: ChargeListQuery) => ['charges', q] as const
const chargeKey = (id: number) => ['charges', id] as const

export function useCurrentCashSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: getCurrentSession,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useOpenCashSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opening_amount, notes }: { opening_amount: number; notes?: string }) =>
      openSession(opening_amount, notes),
    onSuccess: (s) => {
      qc.setQueryData(sessionKey, s)
    },
  })
}

export function useCloseCashSession(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CloseSessionPayload) => closeSession(id, payload),
    onSuccess: () => {
      qc.setQueryData(sessionKey, null)
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
      qc.invalidateQueries({ queryKey: ['charges'] })
    },
  })
}

export function useCashSessions(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['cash-sessions', 'list', params],
    queryFn: () => listSessions(params),
    staleTime: 30_000,
  })
}

export function useCashSession(id: number | undefined) {
  return useQuery({
    queryKey: id
      ? (['cash-sessions', id] as const)
      : (['cash-sessions', 'none'] as const),
    queryFn: () => getSession(id as number),
    enabled: !!id,
  })
}

export function useCharges(query: ChargeListQuery) {
  return useQuery({
    queryKey: chargesKey(query),
    queryFn: () => listCharges(query),
    staleTime: 30_000,
  })
}

export function useCharge(id: number | undefined) {
  return useQuery({
    queryKey: id ? chargeKey(id) : ['charges', 'none'],
    queryFn: () => getCharge(id as number),
    enabled: !!id,
  })
}

export function useCreateCharge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ChargeCreatePayload) => createCharge(payload),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['charges'] })
      qc.invalidateQueries({ queryKey: sessionKey })
      qc.invalidateQueries({ queryKey: ['patients', c.patient_id, 'account'] })
    },
  })
}

export function useAddPayment(chargeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: ChargePaymentPayload & { overpayment_credit_amount?: number }) =>
      addPayment(chargeId, p),
    onSuccess: (c) => {
      qc.setQueryData(chargeKey(chargeId), c)
      qc.invalidateQueries({ queryKey: ['charges'] })
      qc.invalidateQueries({ queryKey: sessionKey })
      qc.invalidateQueries({ queryKey: ['patients', c.patient_id, 'account'] })
    },
  })
}

export function useCancelCharge(chargeId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => cancelCharge(chargeId),
    onSuccess: (c) => {
      qc.setQueryData(chargeKey(chargeId), c)
      qc.invalidateQueries({ queryKey: ['charges'] })
      // Invalidar el estado de cuenta del paciente para que se refresque
      // automáticamente tras cancelar (fix del bug de no actualización).
      qc.invalidateQueries({ queryKey: ['patients', c.patient_id, 'account'] })
    },
  })
}

export function useCashExpenses(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['cash-expenses', 'list', params],
    queryFn: () => listCashExpenses(params),
    staleTime: 30_000,
  })
}

export function useCreateCashExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: CashExpensePayload) => createCashExpense(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-expenses'] })
      qc.invalidateQueries({ queryKey: sessionKey })
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}

export function useDeleteCashExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCashExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-expenses'] })
      qc.invalidateQueries({ queryKey: sessionKey })
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}

export function useCashSessionMovements(
  sessionId: number | undefined,
  query: CashMovementsQuery = {},
) {
  return useQuery({
    queryKey: sessionId
      ? (['cash-sessions', sessionId, 'movements', query] as const)
      : (['cash-sessions', 'none', 'movements'] as const),
    queryFn: () => listCashSessionMovements(sessionId as number, query),
    enabled: !!sessionId,
    staleTime: 15_000,
  })
}

/** Vista admin: movimientos consolidados de todas las sesiones. */
export function useCashMovements(filters: CashMovementsFilters = {}) {
  return useQuery({
    queryKey: ['cash-movements', filters] as const,
    queryFn: () => listCashMovements(filters),
    staleTime: 15_000,
  })
}

export function usePatientAccount(patientId: number | undefined) {
  return useQuery({
    queryKey: patientId
      ? (['patients', patientId, 'account'] as const)
      : (['patients', 'none', 'account'] as const),
    queryFn: () => getPatientAccount(patientId as number),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}
