import { api } from '@/shared/api/client'
import type { AuditEntry, AuditMeta } from '@/shared/types/audit'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface AuditListQuery {
  user_id?: number
  event?: string
  auditable_type?: string
  auditable_id?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export async function listAudits(query: AuditListQuery = {}): Promise<{
  data: AuditEntry[]
  meta: PaginatedMeta
}> {
  const { data } = await api.get<{ data: AuditEntry[]; meta: PaginatedMeta }>(
    '/api/audits',
    { params: query },
  )
  return data
}

export async function getAuditsMeta(): Promise<AuditMeta> {
  const { data } = await api.get<{ data: AuditMeta }>('/api/audits/meta')
  return data.data
}
