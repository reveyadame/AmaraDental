export type CashSessionStatus = 'open' | 'closed'
/**
 * `card` = tarjeta de débito (valor histórico). Las tarjetas de crédito
 * usan `card_credit`. Se separan para conciliar contra estados de cuenta
 * de banco y para reportar comisiones bancarias por separado.
 */
export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'card_credit'
  | 'transfer'
  | 'credit'
export type ChargeStatus = 'pending' | 'partial' | 'paid' | 'cancelled'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta de débito',
  card_credit: 'Tarjeta de crédito',
  transfer: 'Transferencia',
  credit: 'Saldo a favor',
}

export type PatientCreditSource =
  | 'overpayment'
  | 'applied_to_charge'
  | 'manual_add'
  | 'manual_remove'
  | 'refund_overpayment'
  | 'refund_application'

export const PATIENT_CREDIT_SOURCE_LABEL: Record<PatientCreditSource, string> = {
  overpayment: 'Sobrepago',
  applied_to_charge: 'Aplicado a cobro',
  manual_add: 'Ajuste manual (+)',
  manual_remove: 'Ajuste manual (−)',
  refund_overpayment: 'Reverso de sobrepago',
  refund_application: 'Reverso de aplicación',
}

export interface PatientCreditMovement {
  id: number
  patient_id: number
  amount: number
  source: PatientCreditSource
  charge_id: number | null
  charge_payment_id: number | null
  notes: string | null
  created_by_user_id: number | null
  created_by_name?: string | null
  created_at: string | null
}

export type CashMovementType = 'payment' | 'expense'

export interface CashMovement {
  type: CashMovementType
  id: number
  occurred_at: string | null
  amount: number
  method: PaymentMethod | string
  reference: string | null
  notes: string | null
  charge_id: number | null
  charge_code: string | null
  charge_status?: ChargeStatus | null
  patient_id: number | null
  patient_name: string | null
  user_name?: string | null
  registered_by_name?: string | null
  cash_session_id?: number | null
  cash_session_status?: CashSessionStatus | null
  /** Solo en egresos */
  category: string | null
  description: string | null
}

export interface CashMovementsResponse {
  data: CashMovement[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    sums: { in: number; out: number; net: number }
  }
}

/** Colores semánticos consistentes para mostrar estados de cobro en la UI. */
export const CHARGE_STATUS_BADGE: Record<
  ChargeStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100',
  },
  partial: {
    label: 'Parcial',
    className: 'bg-sky-100 text-sky-900 border border-sky-200 hover:bg-sky-100',
  },
  paid: {
    label: 'Pagado',
    className:
      'bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-rose-100 text-rose-900 border border-rose-200 hover:bg-rose-100',
  },
}

export type ExpenseCategory =
  | 'lab'
  | 'supplies'
  | 'payroll'
  | 'utilities'
  | 'commission'
  | 'refund'
  | 'other'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  lab: 'Laboratorio',
  supplies: 'Insumos',
  payroll: 'Sueldos / honorarios',
  utilities: 'Servicios (luz, agua…)',
  commission: 'Comisión',
  refund: 'Devolución',
  other: 'Otro',
}

export interface CashExpense {
  id: number
  cash_session_id: number
  user_id: number
  user_name?: string
  category: ExpenseCategory
  description: string
  method: PaymentMethod
  amount: number
  reference: string | null
  related_lab_order_id: number | null
  paid_at: string | null
  notes: string | null
  created_at?: string | null
}

export interface CashSession {
  id: number
  status: CashSessionStatus
  opened_at: string | null
  closed_at: string | null
  opening_amount: number
  // Efectivo
  closing_amount: number | null
  expected_cash: number | null
  difference: number | null
  // Tarjeta de débito
  card_counted: number | null
  card_expected: number | null
  card_difference: number | null
  // Tarjeta de crédito
  card_credit_counted: number | null
  card_credit_expected: number | null
  card_credit_difference: number | null
  // Transferencia
  transfer_counted: number | null
  transfer_expected: number | null
  transfer_difference: number | null
  notes: string | null
  close_notes: string | null
  user_id: number
  user_name?: string
  opened_by_name?: string
  closed_by_user_id: number | null
  closed_by_name?: string | null
  payments_summary?: {
    count: number
    total: number
    by_method: Record<string, number>
  }
  payments?: ChargePayment[]
  expenses_summary?: {
    count: number
    total: number
    by_method: Record<string, number>
    by_category: Record<string, number>
  }
  expenses?: CashExpense[]
}

export interface ChargeItem {
  id: number
  treatment_id: number | null
  treatment_name: string
  treatment_code: string | null
  specialist_id: number | null
  specialist_name: string | null
  quantity: number
  unit_price: number
  discount_id: number | null
  discount_amount: number
  line_total: number
  commission_percent: number | null
  commission_amount: number
}

export interface ChargePayment {
  id: number
  charge_id: number
  cash_session_id: number
  method: PaymentMethod
  amount: number
  paid_at: string | null
  reference: string | null
  notes: string | null
  user_id: number
  user_name?: string
}

export interface Charge {
  id: number
  code: string | null
  patient_id: number
  patient_name?: string
  subtotal: number
  discount_total: number
  total: number
  paid_total: number
  balance: number
  status: ChargeStatus
  notes: string | null
  paid_at: string | null
  cancelled_at: string | null
  created_at: string | null
  created_by_user_id: number
  created_by_name?: string
  items?: ChargeItem[]
  payments?: ChargePayment[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
