import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { Discount } from '@/shared/types/catalog'

export async function listDiscounts(): Promise<Discount[]> {
  const { data } = await api.get<{ data: Discount[] }>('/api/discounts')
  return data.data
}

export interface DiscountPayload {
  name: string
  type: 'percent' | 'amount'
  value: number
  scope: 'global' | 'treatment'
  treatment_id?: number | null
  valid_from?: string | null
  valid_to?: string | null
  active?: boolean
}

export async function createDiscount(p: DiscountPayload): Promise<Discount> {
  const { data } = await api.post<ApiEnvelope<Discount>>('/api/discounts', p)
  return data.data
}

export async function updateDiscount(id: number, p: Partial<DiscountPayload>): Promise<Discount> {
  const { data } = await api.put<ApiEnvelope<Discount>>(`/api/discounts/${id}`, p)
  return data.data
}

export async function deleteDiscount(id: number): Promise<void> {
  await api.delete(`/api/discounts/${id}`)
}
