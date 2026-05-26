import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeAppointmentStatus,
  createAgendaBlock,
  createAppointment,
  deleteAgendaBlock,
  deleteAppointment,
  getAppointment,
  getIcsFeedToken,
  listAgendaBlocks,
  listAppointments,
  regenerateIcsFeedToken,
  updateAgendaBlock,
  updateAppointment,
  type AgendaBlockPayload,
  type AgendaBlockQuery,
  type AppointmentPayload,
  type AppointmentQuery,
} from './api'
import type { AppointmentStatus } from '@/shared/types/agenda'

const listKey = (q: AppointmentQuery) => ['appointments', q] as const
const itemKey = (id: number) => ['appointments', id] as const
const feedKey = ['agenda', 'feed-token'] as const

export function useAppointments(q: AppointmentQuery) {
  return useQuery({
    queryKey: listKey(q),
    queryFn: () => listAppointments(q),
    staleTime: 30_000,
  })
}

export function useAppointment(id: number | undefined) {
  return useQuery({
    queryKey: id ? itemKey(id) : ['appointments', 'none'],
    queryFn: () => getAppointment(id as number),
    enabled: !!id,
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: AppointmentPayload) => createAppointment(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useUpdateAppointment(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<AppointmentPayload>) => updateAppointment(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useChangeAppointmentStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: AppointmentStatus) => changeAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

/**
 * Variante para cambio rápido: el ID se pasa en cada llamada en vez de
 * fijarlo al hook. Útil cuando el menú vive dentro de cada cita.
 */
export function useQuickChangeAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      changeAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useDeleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })
}

export function useIcsFeedToken() {
  return useQuery({
    queryKey: feedKey,
    queryFn: getIcsFeedToken,
    staleTime: 5 * 60_000,
  })
}

export function useRegenerateIcsFeedToken() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: regenerateIcsFeedToken,
    onSuccess: (info) => qc.setQueryData(feedKey, info),
  })
}

const blocksKey = (q: AgendaBlockQuery) => ['agenda-blocks', q] as const

export function useAgendaBlocks(q: AgendaBlockQuery) {
  return useQuery({
    queryKey: blocksKey(q),
    queryFn: () => listAgendaBlocks(q),
    staleTime: 30_000,
  })
}

export function useCreateAgendaBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: AgendaBlockPayload) => createAgendaBlock(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda-blocks'] }),
  })
}

export function useUpdateAgendaBlock(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<AgendaBlockPayload>) => updateAgendaBlock(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda-blocks'] }),
  })
}

export function useDeleteAgendaBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAgendaBlock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda-blocks'] }),
  })
}
