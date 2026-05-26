export const ROUTES_OF_ADMINISTRATION = [
  { value: 'oral', label: 'Oral' },
  { value: 'sublingual', label: 'Sublingual' },
  { value: 'topical', label: 'Tópica' },
  { value: 'intramuscular', label: 'Intramuscular' },
  { value: 'intravenous', label: 'Intravenosa' },
  { value: 'subcutaneous', label: 'Subcutánea' },
  { value: 'ophthalmic', label: 'Oftálmica' },
  { value: 'otic', label: 'Ótica' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'inhalation', label: 'Inhalada' },
  { value: 'other', label: 'Otra' },
] as const

export type RouteOfAdministration = (typeof ROUTES_OF_ADMINISTRATION)[number]['value']

export const ROUTE_LABEL: Record<string, string> = Object.fromEntries(
  ROUTES_OF_ADMINISTRATION.map((r) => [r.value, r.label]),
)

export interface PrescriptionItem {
  id: number
  medication: string
  presentation: string | null
  dosage: string
  route: RouteOfAdministration | null
  frequency: string
  duration: string
  instructions: string | null
  order_index: number
}

export interface Prescription {
  id: number
  code: string | null
  patient_id: number
  patient_name?: string
  patient_age?: number | null
  patient_gender?: 'M' | 'F' | 'Otro'
  specialist_id: number
  specialist_name?: string
  specialist_cedula?: string | null
  specialist_specialty?: string | null
  appointment_id: number | null
  diagnosis: string | null
  notes: string | null
  issued_at: string
  created_at: string | null
  created_by_user_id: number
  items: PrescriptionItem[]
}

export interface PrescriptionTemplateItem {
  id?: number
  medication: string
  presentation: string | null
  dosage: string
  route: RouteOfAdministration | null
  frequency: string
  duration: string
  instructions: string | null
  order_index: number
}

export interface PrescriptionTemplate {
  id: number
  name: string
  category: string | null
  description: string | null
  active: boolean
  created_by_user_id: number | null
  created_by_name?: string | null
  created_at: string | null
  updated_at: string | null
  items: PrescriptionTemplateItem[]
  items_count?: number
}
