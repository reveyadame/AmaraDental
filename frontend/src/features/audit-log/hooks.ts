import { useQuery } from '@tanstack/react-query'
import { getAuditsMeta, listAudits, type AuditListQuery } from './api'

export function useAudits(query: AuditListQuery = {}) {
  return useQuery({
    queryKey: ['audits', query],
    queryFn: () => listAudits(query),
    staleTime: 30_000,
  })
}

export function useAuditsMeta() {
  return useQuery({
    queryKey: ['audits', 'meta'],
    queryFn: getAuditsMeta,
    staleTime: 5 * 60_000,
  })
}
