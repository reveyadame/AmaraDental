export interface ReportRange {
  date_from: string
  date_to: string
}

export interface SalesReport {
  meta: ReportRange
  totals: {
    gross: number
    discount: number
    net: number
    charges: number
    lines: number
  }
  by_treatment: Array<{
    treatment_id: number | null
    treatment_name: string
    total: number
    qty: number
  }>
  by_specialist: Array<{
    specialist_id: number | null
    specialist_name: string
    total: number
    count: number
  }>
  by_day: Array<{ day: string; total: number }>
}

export interface PaymentsReport {
  meta: ReportRange
  totals: { total: number; count: number }
  by_method: Array<{ method: 'cash' | 'card' | 'transfer'; total: number; count: number }>
  by_user: Array<{ user_id: number | null; user_name: string; total: number; count: number }>
  by_day: Array<{ day: string; total: number }>
}

export interface CommissionsReport {
  meta: ReportRange
  totals: { commission: number; count: number; base: number }
  by_specialist: Array<{
    specialist_id: number | null
    specialist_name: string
    commission: number
    line_total: number
    count: number
  }>
  items: Array<{
    id: number
    charge_id: number
    charge_code: string | null
    charge_status: string
    charge_created_at: string
    specialist_id: number | null
    specialist_name: string
    treatment_name: string
    patient_name: string
    line_total: number
    commission_percent: number | null
    commission_amount: number
  }>
}

export interface ReportQuery {
  date_from?: string
  date_to?: string
  specialist_id?: number
  user_id?: number
}
