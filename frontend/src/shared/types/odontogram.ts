export type FaceKey = 'oclusal' | 'mesial' | 'distal' | 'vestibular' | 'lingual'

export type FaceState = 'healthy' | 'caries' | 'restored' | 'sealant' | 'defective'

export type WholeToothState =
  | 'absent'
  | 'crown'
  | 'endodontics'
  | 'implant'
  | 'fracture'
  | 'extraction_indicated'
  | 'prosthesis'

export interface ToothState {
  tooth_number: number
  dentition_type: 'permanent' | 'deciduous'
  whole_state: WholeToothState | null
  faces: Record<FaceKey, FaceState>
  notes: string | null
  updated_at: string | null
  updated_by_user_id: number | null
  updated_by_name: string | null
}

export interface OdontogramResponse {
  data: ToothState[]
  meta: {
    patient_id: number
    dentition: 'permanent'
    general_diagnosis: string | null
  }
}

export interface UpdateToothStatePayload {
  whole_state?: WholeToothState | null
  faces?: Partial<Record<FaceKey, FaceState>>
  notes?: string | null
}

export interface TreatmentLogEntry {
  id: number
  patient_id: number
  tooth_number: number | null
  treatment_id: number | null
  treatment_name?: string | null
  performed_on: string
  description: string
  notes: string | null
  created_by_user_id: number | null
  created_by_name?: string | null
  created_at: string | null
}

export interface CreateTreatmentLogPayload {
  performed_on: string
  tooth_number?: number | null
  treatment_id?: number | null
  description: string
  notes?: string | null
}

export const PERMANENT_TEETH: number[] = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

export const FACE_LABELS: Record<FaceKey, string> = {
  oclusal: 'Oclusal / Incisal',
  mesial: 'Mesial',
  distal: 'Distal',
  vestibular: 'Vestibular',
  lingual: 'Lingual / Palatino',
}

export const FACE_STATE_LABELS: Record<FaceState, string> = {
  healthy: 'Sana',
  caries: 'Caries',
  restored: 'Restaurada',
  sealant: 'Sellador',
  defective: 'Restauración defectuosa',
}

export const FACE_STATE_COLORS: Record<FaceState, string> = {
  healthy: '#ffffff',
  caries: '#ef4444',
  restored: '#3b82f6',
  sealant: '#22c55e',
  defective: '#f59e0b',
}

export const WHOLE_STATE_LABELS: Record<WholeToothState, string> = {
  absent: 'Ausente',
  crown: 'Corona',
  endodontics: 'Endodoncia',
  implant: 'Implante',
  fracture: 'Fractura',
  extraction_indicated: 'Extracción indicada',
  prosthesis: 'Prótesis',
}

export function toothLabel(n: number): string {
  return String(n)
}

export function isUpper(n: number): boolean {
  return n >= 11 && n <= 28
}

export function isAnterior(n: number): boolean {
  const last = n % 10
  return last >= 1 && last <= 3
}
