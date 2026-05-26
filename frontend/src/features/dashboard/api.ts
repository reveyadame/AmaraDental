import { api } from '@/shared/api/client'

export interface DashboardKpis {
  revenue_today: number
  revenue_yesterday: number
  pending_balance_count: number
  pending_balance_total: number
  appointments_today_count: number
  recalls_overdue_count: number
  recalls_this_week_count: number
  patients_total: number
  lab_orders_overdue_count: number
}

export interface DashboardRevenuePoint {
  date: string
  total: number
}

export interface DashboardUpcomingAppointment {
  id: number
  starts_at: string | null
  ends_at: string | null
  patient_id: number | null
  patient_name: string | null
  specialist_name: string | null
  treatment_name: string | null
  status: string
}

export interface DashboardUrgentRecall {
  id: number
  patient_id: number
  patient_name: string | null
  treatment_name: string | null
  recall_label: string | null
  due_on: string
  days_until_due: number | null
}

export interface DashboardTopPending {
  patient_id: number
  patient_name: string | null
  total_balance: number
  charges_count: number
}

export interface DashboardCashSession {
  id: number
  opened_at: string | null
  opening_amount: number
  payments_total: number
  expenses_total: number
  payments_by_method: Record<string, number>
}

export interface DashboardSummary {
  kpis: DashboardKpis
  revenue_series: DashboardRevenuePoint[]
  payments_by_method_today: { cash: number; card: number; transfer: number }
  upcoming_appointments: DashboardUpcomingAppointment[]
  urgent_recalls: DashboardUrgentRecall[]
  top_pending_balances: DashboardTopPending[]
  cash_session: DashboardCashSession | null
}

export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await api.get<{ data: DashboardSummary }>('/api/dashboard')
  return data.data
}
