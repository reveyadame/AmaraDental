export type LabOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'received'
  | 'delivered'
  | 'cancelled'

export const LAB_ORDER_STATUS_LABELS: Record<LabOrderStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  received: 'Recibida',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

export interface Lab {
  id: number
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  active: boolean
  orders_count?: number
  created_at?: string
  updated_at?: string
}

export interface LabOrder {
  id: number
  patient_id: number
  patient_name?: string
  treatment_id: number | null
  treatment_name?: string | null
  specialist_id: number | null
  specialist_name?: string | null
  lab_id: number | null
  lab_name: string
  work_type: string | null
  specifications: string | null
  sent_on: string | null
  due_on: string | null
  received_on: string | null
  delivered_to_patient_on: string | null
  cost: number
  status: LabOrderStatus
  notes: string | null
  created_at?: string
  updated_at?: string
}
