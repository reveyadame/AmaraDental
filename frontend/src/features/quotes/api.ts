import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { PaginatedResponse, PaymentMethod } from '@/shared/types/cash'
import type { Quote, QuoteConvertResponse } from '@/shared/types/quote'

export interface QuoteItemPayload {
  treatment_id: number
  specialist_id?: number | null
  quantity: number
  discount_id?: number | null
  unit_price_override?: number | null
}

export interface QuoteCreatePayload {
  patient_id: number
  notes?: string | null
  valid_until?: string | null
  items: QuoteItemPayload[]
}

export interface QuoteUpdatePayload {
  notes?: string | null
  valid_until?: string | null
  items: QuoteItemPayload[]
}

export interface QuoteListQuery {
  status?: string
  patient_id?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface ConvertQuotePayload {
  notes?: string | null
  payments?: Array<{
    method: PaymentMethod
    amount: number
    reference?: string | null
    notes?: string | null
  }>
}

export async function listQuotes(query: QuoteListQuery = {}): Promise<{
  data: Quote[]
  meta: PaginatedResponse<Quote>['meta']
}> {
  const { data } = await api.get<{
    data: Quote[]
    meta: PaginatedResponse<Quote>['meta']
  }>('/api/quotes', { params: query })
  return data
}

export async function getQuote(id: number): Promise<Quote> {
  const { data } = await api.get<ApiEnvelope<Quote>>(`/api/quotes/${id}`)
  return data.data
}

export async function createQuote(payload: QuoteCreatePayload): Promise<Quote> {
  const { data } = await api.post<ApiEnvelope<Quote>>('/api/quotes', payload)
  return data.data
}

export async function updateQuote(
  id: number,
  payload: QuoteUpdatePayload,
): Promise<Quote> {
  const { data } = await api.put<ApiEnvelope<Quote>>(`/api/quotes/${id}`, payload)
  return data.data
}

export async function deleteQuote(id: number): Promise<void> {
  await api.delete(`/api/quotes/${id}`)
}

export async function markQuoteSent(id: number): Promise<Quote> {
  const { data } = await api.post<ApiEnvelope<Quote>>(`/api/quotes/${id}/sent`)
  return data.data
}

export async function markQuoteAccepted(id: number): Promise<Quote> {
  const { data } = await api.post<ApiEnvelope<Quote>>(`/api/quotes/${id}/accepted`)
  return data.data
}

export async function markQuoteRejected(id: number): Promise<Quote> {
  const { data } = await api.post<ApiEnvelope<Quote>>(`/api/quotes/${id}/rejected`)
  return data.data
}

export async function reopenQuote(id: number): Promise<Quote> {
  const { data } = await api.post<ApiEnvelope<Quote>>(`/api/quotes/${id}/reopen`)
  return data.data
}

export async function convertQuote(
  id: number,
  payload: ConvertQuotePayload,
): Promise<QuoteConvertResponse> {
  const { data } = await api.post<ApiEnvelope<QuoteConvertResponse>>(
    `/api/quotes/${id}/convert`,
    payload,
  )
  return data.data
}
