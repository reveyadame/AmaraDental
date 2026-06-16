import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'

export interface Billing {
  plan: string | null
  on_trial: boolean
  trial_ends_at: string | null
  subscribed: boolean
  on_grace_period: boolean
  stripe_status: string | null
  ends_at: string | null
  has_active_billing: boolean
  card_last_four: string | null
}

export async function getBilling(): Promise<Billing> {
  const { data } = await api.get<ApiEnvelope<Billing>>('/api/billing')
  return data.data
}

export interface Invoice {
  date: string
  total: string // ej. "MX$999.00"
  status: string // paid | open | void | uncollectible
  url: string | null
}

export interface BillingDetails {
  subscribed: boolean
  on_trial: boolean
  trial_ends_at: string | null
  status: string | null
  ends_at: string | null
  renews_at: string | null
  card_last_four: string | null
  invoices: Invoice[]
}

export async function getBillingDetails(): Promise<BillingDetails> {
  const { data } = await api.get<ApiEnvelope<BillingDetails>>('/api/billing/details')
  return data.data
}

/** Crea el checkout de Stripe y devuelve la URL a la que redirigir. */
export async function startCheckout(): Promise<string> {
  const { data } = await api.post<{ url: string }>('/api/billing/checkout')
  return data.url
}

/** Devuelve la URL del portal de facturación de Stripe (administrar tarjeta). */
export async function openPortal(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/api/billing/portal')
  return data.url
}
