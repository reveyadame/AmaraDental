import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { PaymentMethod } from '@/shared/types/cash'
import type {
  CommissionPayment,
  PendingCommissionGroup,
} from '@/shared/types/commission'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PendingQuery {
  specialist_id?: number
  date_from?: string
  date_to?: string
}

export async function listPendingCommissions(
  q: PendingQuery = {},
): Promise<PendingCommissionGroup[]> {
  const { data } = await api.get<{ data: PendingCommissionGroup[] }>(
    '/api/commission-payments/pending',
    { params: q },
  )
  return data.data
}

export interface CommissionPaymentListQuery {
  specialist_id?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function listCommissionPayments(
  q: CommissionPaymentListQuery = {},
): Promise<{ data: CommissionPayment[]; meta: PaginatedMeta }> {
  const { data } = await api.get<{ data: CommissionPayment[]; meta: PaginatedMeta }>(
    '/api/commission-payments',
    { params: q },
  )
  return data
}

export async function getCommissionPayment(id: number): Promise<CommissionPayment> {
  const { data } = await api.get<ApiEnvelope<CommissionPayment>>(
    `/api/commission-payments/${id}`,
  )
  return data.data
}

export interface CommissionPaymentPayload {
  specialist_id: number
  charge_item_ids: number[]
  method: PaymentMethod
  reference?: string | null
  notes?: string | null
  paid_at?: string | null
  register_as_expense?: boolean
}

export async function createCommissionPayment(
  payload: CommissionPaymentPayload,
): Promise<CommissionPayment> {
  const { data } = await api.post<ApiEnvelope<CommissionPayment>>(
    '/api/commission-payments',
    payload,
  )
  return data.data
}

export async function deleteCommissionPayment(id: number): Promise<void> {
  await api.delete(`/api/commission-payments/${id}`)
}
