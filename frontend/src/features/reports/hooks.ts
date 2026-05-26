import { useQuery } from '@tanstack/react-query'
import {
  getCommissionsReport,
  getPaymentsReport,
  getSalesReport,
} from './api'
import type { ReportQuery } from '@/shared/types/report'

export function useSalesReport(q: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'sales', q],
    queryFn: () => getSalesReport(q),
    staleTime: 30_000,
  })
}

export function usePaymentsReport(q: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'payments', q],
    queryFn: () => getPaymentsReport(q),
    staleTime: 30_000,
  })
}

export function useCommissionsReport(q: ReportQuery) {
  return useQuery({
    queryKey: ['reports', 'commissions', q],
    queryFn: () => getCommissionsReport(q),
    staleTime: 30_000,
  })
}
