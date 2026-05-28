export type Gender = 'M' | 'F' | 'Otro'
export type PregnancyStatus = 'no' | 'si' | 'posible' | 'na'
export type CountryCode = 'MX' | 'US'

export type MaritalStatus =
  | 'soltero'
  | 'casado'
  | 'union_libre'
  | 'divorciado'
  | 'viudo'
  | 'separado'

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  soltero: 'Soltero(a)',
  casado: 'Casado(a)',
  union_libre: 'Unión libre',
  divorciado: 'Divorciado(a)',
  viudo: 'Viudo(a)',
  separado: 'Separado(a)',
}

export interface Patient {
  id: number
  full_name: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  age: number | null
  gender: Gender
  marital_status: MaritalStatus | null
  curp: string | null
  rfc: string | null
  email: string | null
  phone: string | null
  mobile_phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: CountryCode | null
  postal_code: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  occupation: string | null
  referred_by: string | null
  notes: string | null
  active: boolean
  created_at: string | null
  updated_at: string | null
  medical_history?: MedicalHistory | null
  consents?: Consent[]
}

export interface MedicalHistory {
  id: number | null
  patient_id: number
  chronic_conditions: string[]
  allergies: string[]
  current_medications: string[]
  previous_surgeries: string | null
  family_history: string | null
  dental_history: string | null
  last_dental_visit: string | null
  pregnancy_status: PregnancyStatus | null
  smoker: boolean | null
  alcohol_consumer: boolean | null
  blood_pressure: string | null
  heart_rate: number | null
  temperature: number | null
  weight_kg: number | null
  height_cm: number | null
  notes: string | null
  updated_by_user_id: number | null
  updated_at: string | null
}

export interface ConsentTemplate {
  id: number
  title: string
  body: string
  treatment_type: string | null
  active: boolean
  updated_at: string | null
}

export interface Consent {
  id: number
  patient_id: number
  consent_template_id: number | null
  title: string
  body?: string
  has_signature: boolean
  signature_image?: string
  signed_by_name: string
  signed_at: string | null
  captured_by_user_id: number | null
  created_at: string | null
}

export interface Paginated<T> {
  data: T[]
  links: { first: string; last: string; prev: string | null; next: string | null }
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
}
