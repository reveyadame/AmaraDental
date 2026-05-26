import type { PaymentMethod } from './cash'

export interface PendingCommissionItem {
  id: number
  charge_id: number
  charge_code: string | null
  /** Estado del cobro origen — útil para distinguir anticipos. */
  charge_status: 'pending' | 'partial' | 'paid' | string | null
  charge_total: number
  charge_paid_total: number
  charge_balance: number
  /** Proporción 0–1 de lo que el paciente ya pagó del cobro. */
  charge_paid_ratio: number
  charge_date: string | null
  charge_paid_at: string | null
  patient_name: string | null
  treatment_name: string
  line_total: number
  commission_percent: number
  commission_amount: number
  /** Sugerencia: comisión proporcional al porcentaje cobrado. */
  commission_paid_share: number
}

export interface PendingCommissionGroup {
  specialist_id: number
  specialist_name: string | null
  items_count: number
  total_pending: number
  items: PendingCommissionItem[]
}

export interface CommissionPaymentItem {
  id: number
  charge_id: number
  charge_code: string | null
  treatment_name: string
  patient_name: string | null
  commission_amount: number
  line_total: number
  charge_date: string | null
}

export interface CommissionPayment {
  id: number
  specialist_id: number
  specialist_name: string | null
  paid_at: string
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  cash_session_id: number | null
  cash_expense_id: number | null
  created_by_user_id: number
  created_by_name?: string | null
  items?: CommissionPaymentItem[]
  items_count?: number
  created_at?: string
}
