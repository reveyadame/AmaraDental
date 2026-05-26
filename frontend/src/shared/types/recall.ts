export type RecallStatus = 'pending' | 'scheduled' | 'completed' | 'dismissed'

export const RECALL_STATUS_LABELS: Record<RecallStatus, string> = {
  pending: 'Pendiente',
  scheduled: 'Agendado',
  completed: 'Completado',
  dismissed: 'Descartado',
}

export interface Recall {
  id: number
  patient_id: number
  patient_name?: string
  patient_phone?: string | null
  treatment_id: number
  treatment_name?: string
  /** Etiqueta del recall configurada en el tratamiento (fallback al nombre). */
  recall_label?: string
  due_on: string
  days_until_due: number | null
  is_overdue: boolean
  status: RecallStatus
  source_charge_id: number | null
  scheduled_appointment_id: number | null
  scheduled_at?: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}
