export interface MembershipPlanTreatment {
  id: number
  name: string
  code: string | null
  base_price: number
  discount_percent: number | null
  annual_quota: number | null
}

export interface MembershipPlan {
  id: number
  name: string
  description: string | null
  annual_price: number
  valid_months: number
  default_discount_percent: number
  active: boolean
  treatments?: MembershipPlanTreatment[]
  created_at?: string
  updated_at?: string
}

export type MembershipStatus = 'active' | 'expired' | 'cancelled'

export interface MembershipUsage {
  treatment_id: number
  treatment_name: string
  consumed: number
  annual_quota: number | null
  remaining: number | null
}

export interface MembershipHistoryEntry {
  id: number
  treatment_id: number | null
  treatment_name: string
  quantity: number
  unit_price: number
  line_total: number
  charge_id: number
  charge_code: string | null
  date: string | null
}

export interface Membership {
  id: number
  patient_id: number
  patient_name?: string
  membership_plan_id: number
  plan_name?: string
  starts_on: string
  ends_on: string
  status: MembershipStatus
  is_currently_active: boolean
  price_paid: number
  charge_id: number | null
  notes: string | null
  plan?: MembershipPlan
  usage?: MembershipUsage[]
  history?: MembershipHistoryEntry[]
  created_at?: string
  updated_at?: string
}
