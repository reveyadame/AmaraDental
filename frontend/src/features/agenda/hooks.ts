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
  markNoShowAndDiscardPatient,
  regenerateIcsFeedToken,
  updateAgendaBlock,
  updateAppointment,
  type AgendaBlockPayload,
  type AgendaBlockQuery,
  type AppointmentPayload,
  type AppointmentQuery,
} from './api'
import type { Appointment, AppointmentStatus } from '@/shared/types/agenda'

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

/**
 * Reprograma una cita (drag & drop en la agenda). Solo mueve fecha/hora —
 * conserva todo lo demás. Actualiza de forma optimista todas las listas de
 * citas en caché para que la cita "salte" al instante, y revierte si el
 * backend rechaza el cambio (especialista no disponible / agenda cerrada).
 */
export function useRescheduleAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      starts_at,
      ends_at,
    }: {
      id: number
      starts_at: string
      ends_at: string
    }) => updateAppointment(id, { starts_at, ends_at }),
    onMutate: async ({ id, starts_at, ends_at }) => {
      await qc.cancelQueries({ queryKey: ['appointments'] })
      const snapshots = qc.getQueriesData<Appointment[]>({ queryKey: ['appointments'] })
      snapshots.forEach(([key, list]) => {
        if (!Array.isArray(list)) return
        qc.setQueryData(
          key,
          list.map((a) => (a.id === id ? { ...a, starts_at, ends_at } : a)),
        )
      })
      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, list]) => qc.setQueryData(key, list))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
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

/**
 * Marca la cita como no_show y descarta al paciente cuando es de
 * "primera vez". Si el paciente acumuló registros entre tanto, solo
 * deja la cita en no_show y devuelve los bloqueadores.
 */
export function useNoShowAndDiscardPatient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNoShowAndDiscardPatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['patients'] })
    },
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
