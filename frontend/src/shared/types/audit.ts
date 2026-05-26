export type AuditEvent = 'created' | 'updated' | 'deleted' | 'restored'

export const AUDIT_EVENT_LABELS: Record<AuditEvent, string> = {
  created: 'Creado',
  updated: 'Modificado',
  deleted: 'Eliminado',
  restored: 'Restaurado',
}

export interface AuditEntry {
  id: number
  event: AuditEvent
  auditable_type: string
  auditable_label: string
  auditable_id: number
  user_id: number | null
  user_name: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  url: string | null
  ip_address: string | null
  created_at: string
}

export interface AuditMeta {
  types: { value: string; label: string }[]
  users: { id: number; name: string }[]
  events: AuditEvent[]
}
