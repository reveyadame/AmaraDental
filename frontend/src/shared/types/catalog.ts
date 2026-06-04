export interface Treatment {
  id: number
  code: string | null
  name: string
  category: string | null
  description: string | null
  base_price: number
  duration_minutes: number
  commission_percent: number | null
  /** Base de cálculo de la comisión: sobre el precio cobrado o sobre la utilidad (precio − costo). */
  commission_base: 'price' | 'profit'
  /** Costo del insumo a descontar cuando `commission_base === 'profit'`. */
  cost: number
  periodicity_days: number | null
  recall_label: string | null
  requires_consent_template_id: number | null
  active: boolean
  created_at: string | null
  updated_at: string | null
}

export type DiscountType = 'percent' | 'amount'
export type DiscountScope = 'global' | 'treatment'

export interface Discount {
  id: number
  name: string
  type: DiscountType
  value: number
  scope: DiscountScope
  treatment_id: number | null
  treatment?: Treatment | null
  valid_from: string | null
  valid_to: string | null
  active: boolean
}

// El tipo `Specialist` ahora vive en `@/shared/types/api` porque deja de ser
// un User y pasa a ser un catálogo independiente. Re-exportamos para no romper
// imports existentes.
export type { Specialist } from './api'
