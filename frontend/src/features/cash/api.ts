import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  CashExpense,
  CashMovementsResponse,
  CashSession,
  Charge,
  ExpenseCategory,
  PaginatedResponse,
  PatientCreditMovement,
  PaymentMethod,
} from '@/shared/types/cash'

export async function getCurrentSession(): Promise<CashSession | null> {
  const { data } = await api.get<{ data: CashSession | null }>('/api/cash-sessions/current')
  return data.data
}

export async function openSession(opening_amount: number, notes?: string): Promise<CashSession> {
  const { data } = await api.post<ApiEnvelope<CashSession>>('/api/cash-sessions', {
    opening_amount,
    notes,
  })
  return data.data
}

export interface CloseSessionPayload {
  closing_amount: number
  card_counted?: number
  card_credit_counted?: number
  transfer_counted?: number
  close_notes?: string
}

export async function closeSession(
  id: number,
  payload: CloseSessionPayload,
): Promise<CashSession> {
  const { data } = await api.post<ApiEnvelope<CashSession>>(
    `/api/cash-sessions/${id}/close`,
    payload,
  )
  return data.data
}

export async function getSession(id: number): Promise<CashSession> {
  const { data } = await api.get<ApiEnvelope<CashSession>>(`/api/cash-sessions/${id}`)
  return data.data
}

export async function listSessions(params: Record<string, unknown> = {}): Promise<{
  data: CashSession[]
  meta: PaginatedResponse<CashSession>['meta']
}> {
  const { data } = await api.get<{
    data: CashSession[]
    meta: PaginatedResponse<CashSession>['meta']
  }>('/api/cash-sessions', { params })
  return data
}

export interface ChargeListQuery {
  status?: string
  patient_id?: number
  date_from?: string
  date_to?: string
  /** true → solo cobros creados desde que se abrió la caja actual (precisión de hora). */
  current_session?: boolean
  /** true → omite cobros cancelados del listado. */
  exclude_cancelled?: boolean
  has_balance?: boolean
  oldest_first?: boolean
  page?: number
  per_page?: number
}

export interface PatientAccount {
  patient_id: number
  patient_name: string
  totals: {
    invoiced: number
    paid: number
    balance: number
    discounts: number
    charges_count: number
    pending_count: number
    credit_balance: number
  }
  charges: Charge[]
  credit_movements: PatientCreditMovement[]
}

export async function getPatientAccount(patientId: number): Promise<PatientAccount> {
  const { data } = await api.get<{ data: PatientAccount }>(
    `/api/patients/${patientId}/account`,
  )
  return data.data
}

export async function listCharges(query: ChargeListQuery = {}): Promise<{
  data: Charge[]
  meta: PaginatedResponse<Charge>['meta']
}> {
  const { data } = await api.get<{
    data: Charge[]
    meta: PaginatedResponse<Charge>['meta']
  }>('/api/charges', { params: query })
  return data
}

export async function getCharge(id: number): Promise<Charge> {
  const { data } = await api.get<ApiEnvelope<Charge>>(`/api/charges/${id}`)
  return data.data
}

export interface ChargeItemPayload {
  treatment_id: number
  specialist_id?: number | null
  quantity: number
  discount_id?: number | null
  unit_price_override?: number | null
}

export interface ChargePaymentPayload {
  method: PaymentMethod
  amount: number
  reference?: string | null
  notes?: string | null
}

export interface ChargeCreatePayload {
  patient_id: number
  notes?: string | null
  items: ChargeItemPayload[]
  payments?: ChargePaymentPayload[]
  /** Excedente del cobro que se registra como saldo a favor del paciente. */
  overpayment_credit_amount?: number
}

export async function createCharge(payload: ChargeCreatePayload): Promise<Charge> {
  const { data } = await api.post<ApiEnvelope<Charge>>('/api/charges', payload)
  return data.data
}

export async function addPayment(
  chargeId: number,
  payload: ChargePaymentPayload & { overpayment_credit_amount?: number },
): Promise<Charge> {
  const { data } = await api.post<ApiEnvelope<Charge>>(
    `/api/charges/${chargeId}/payments`,
    payload,
  )
  return data.data
}

export async function cancelCharge(chargeId: number): Promise<Charge> {
  const { data } = await api.post<ApiEnvelope<Charge>>(`/api/charges/${chargeId}/cancel`)
  return data.data
}

export interface CashExpensePayload {
  category: ExpenseCategory
  description: string
  method: PaymentMethod
  amount: number
  reference?: string | null
  related_lab_order_id?: number | null
  paid_at?: string | null
  notes?: string | null
}

export async function listCashExpenses(params: Record<string, unknown> = {}): Promise<{
  data: CashExpense[]
  meta: PaginatedResponse<CashExpense>['meta']
}> {
  const { data } = await api.get<{
    data: CashExpense[]
    meta: PaginatedResponse<CashExpense>['meta']
  }>('/api/cash-expenses', { params })
  return data
}

export async function createCashExpense(
  payload: CashExpensePayload,
): Promise<CashExpense> {
  const { data } = await api.post<ApiEnvelope<CashExpense>>(
    '/api/cash-expenses',
    payload,
  )
  return data.data
}

export async function deleteCashExpense(id: number): Promise<void> {
  await api.delete(`/api/cash-expenses/${id}`)
}

export interface CashMovementsQuery {
  page?: number
  per_page?: number
  type?: 'all' | 'payment' | 'expense'
}

export async function listCashSessionMovements(
  sessionId: number,
  query: CashMovementsQuery = {},
): Promise<CashMovementsResponse> {
  const { data } = await api.get<CashMovementsResponse>(
    `/api/cash-sessions/${sessionId}/movements`,
    { params: query },
  )
  return data
}

export interface CashMovementsFilters {
  date_from?: string
  date_to?: string
  type?: 'all' | 'payment' | 'expense'
  method?: PaymentMethod
  q?: string
  page?: number
  per_page?: number
}

/** Vista admin consolidada (pagos + egresos de todas las sesiones). */
export async function listCashMovements(
  filters: CashMovementsFilters = {},
): Promise<CashMovementsResponse> {
  const { data } = await api.get<CashMovementsResponse>('/api/cash-movements', {
    params: filters,
  })
  return data
}

/**
 * Tipos de dependencias que pueden detectarse al eliminar un movimiento.
 * Cuando el backend devuelve 409, contiene este shape.
 */
export interface MovementDependencies {
  commission_payments?: Array<{
    id: number
    specialist_name: string | null
    amount: number
    paid_at: string | null
  }>
  commission_payment?: {
    id: number
    specialist_name: string | null
    amount: number
    paid_at: string | null
  }
  items_count?: number
}

export interface DeleteMovementResult {
  ok: boolean
  /** Si ok=false, contiene la info para mostrar al usuario. */
  dependencies?: MovementDependencies
  message?: string
}

async function tryDelete(
  url: string,
  force: boolean,
): Promise<DeleteMovementResult> {
  try {
    await api.delete(url, { params: force ? { force: 1 } : undefined })
    return { ok: true }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      (err as { response?: { status?: number } }).response?.status === 409
    ) {
      const data = (err as { response: { data: { message: string; dependencies: MovementDependencies } } })
        .response.data
      return {
        ok: false,
        dependencies: data.dependencies,
        message: data.message,
      }
    }
    throw err
  }
}

export function deleteChargePayment(
  id: number,
  force = false,
): Promise<DeleteMovementResult> {
  return tryDelete(`/api/charge-payments/${id}`, force)
}

export function deleteCashExpenseWithDeps(
  id: number,
  force = false,
): Promise<DeleteMovementResult> {
  return tryDelete(`/api/cash-expenses/${id}`, force)
}
