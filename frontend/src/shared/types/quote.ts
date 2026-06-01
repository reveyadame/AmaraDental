import type { Charge } from './cash'

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'converted'

export interface QuoteItem {
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
}

export interface Quote {
  id: number
  code: string | null
  patient_id: number
  patient_name?: string
  subtotal: number
  discount_total: number
  total: number
  status: QuoteStatus
  /** Calculado en el backend: true si vencida y aún editable. */
  is_expired: boolean
  /** Calculado en el backend: true si aún se puede editar. */
  is_editable: boolean
  notes: string | null
  valid_until: string | null
  sent_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  converted_at: string | null
  converted_charge_id: number | null
  created_at: string | null
  updated_at: string | null
  created_by_user_id: number
  created_by_name?: string
  items?: QuoteItem[]
}

/**
 * Etiquetas y estilos para badges de estado. Idéntico patrón a
 * `CHARGE_STATUS_BADGE` en `cash.ts`.
 */
export const QUOTE_STATUS_BADGE: Record<
  QuoteStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Borrador',
    className: 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-100',
  },
  sent: {
    label: 'Enviada',
    className: 'bg-sky-100 text-sky-900 border border-sky-200 hover:bg-sky-100',
  },
  accepted: {
    label: 'Aceptada',
    className:
      'bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100',
  },
  rejected: {
    label: 'Rechazada',
    className: 'bg-rose-100 text-rose-900 border border-rose-200 hover:bg-rose-100',
  },
  converted: {
    label: 'Convertida',
    className:
      'bg-violet-100 text-violet-900 border border-violet-200 hover:bg-violet-100',
  },
}

export interface QuoteConvertResponse {
  quote: Quote
  charge: Charge
}
