import { api } from '@/shared/api/client'
import type {
  CommissionsReport,
  PaymentsReport,
  ReportQuery,
  SalesReport,
} from '@/shared/types/report'

export async function getSalesReport(q: ReportQuery): Promise<SalesReport> {
  const { data } = await api.get<SalesReport>('/api/reports/sales', { params: q })
  return data
}

export async function getPaymentsReport(q: ReportQuery): Promise<PaymentsReport> {
  const { data } = await api.get<PaymentsReport>('/api/reports/payments', { params: q })
  return data
}

export async function getCommissionsReport(q: ReportQuery): Promise<CommissionsReport> {
  const { data } = await api.get<CommissionsReport>('/api/reports/commissions', { params: q })
  return data
}
