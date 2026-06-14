export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_room'
  | 'completed'
  | 'no_show'
  | 'cancelled'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  arrived: 'Paciente llegó',
  in_room: 'En consulta',
  completed: 'Completada',
  no_show: 'No asistió',
  cancelled: 'Cancelada',
}

/**
 * Estados que el usuario puede elegir manualmente en la agenda. Los valores
 * `arrived`/`in_room` quedan como legacy: se conservan en los mapas de arriba
 * para no romper el render de citas históricas que aún los tengan, pero ya no
 * se ofrecen al cambiar el estado ni aparecen en la leyenda.
 */
export const SELECTABLE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'confirmed',
  'completed',
  'no_show',
  'cancelled',
]

export const APPOINTMENT_STATUS_VARIANT: Record<
  AppointmentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  scheduled: 'outline',
  confirmed: 'default',
  arrived: 'default',
  in_room: 'default',
  completed: 'secondary',
  no_show: 'destructive',
  cancelled: 'destructive',
}

export interface Appointment {
  id: number
  patient_id: number
  patient_name?: string
  patient_phone?: string | null
  patient_is_first_visit?: boolean
  specialist_id: number
  specialist_name?: string
  treatment_id: number | null
  treatment_name?: string | null
  title: string | null
  notes: string | null
  starts_at: string
  ends_at: string
  duration_minutes: number | null
  room: string | null
  status: AppointmentStatus
  confirmed_at: string | null
  reminder_sent_at: string | null
  created_by_user_id: number
  created_at: string | null
  updated_at: string | null
}

export interface IcsFeedInfo {
  token: string
  url: string
  generated_at: string | null
}

export interface AgendaBlock {
  id: number
  specialist_id: number | null
  specialist_name?: string | null
  starts_at: string
  ends_at: string
  all_day: boolean
  title: string
  notes: string | null
  created_by_user_id: number | null
  created_at?: string | null
}
