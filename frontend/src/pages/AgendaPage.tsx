import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAgendaBlocks,
  useAppointments,
  useChangeAppointmentStatus,
  useRescheduleAppointment,
} from '@/features/agenda/hooks'
import { AppointmentDialog } from '@/features/agenda/AppointmentDialog'
import { AgendaBlockDialog } from '@/features/agenda/AgendaBlockDialog'
import { AgendaTimeGrid, StatusLegend } from '@/features/agenda/AgendaTimeGrid'
import { IcsFeedCard } from '@/features/agenda/IcsFeedCard'
import { useSpecialists } from '@/features/specialists/hooks'
import { useMe } from '@/features/auth/hooks'
import type {
  AgendaBlock,
  Appointment,
  AppointmentStatus,
} from '@/shared/types/agenda'
import { APPOINTMENT_STATUS_LABELS } from '@/shared/types/agenda'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/shared/lib/utils'
import { colorForSpecialist } from '@/features/agenda/specialistColors'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

type View = 'day' | 'week'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** Extrae el mensaje de conflicto que devuelve el backend (422). */
function rescheduleErrorMessage(err: unknown): string {
  const fallback = 'No fue posible reprogramar la cita'
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (
      err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
    ).response?.data
    const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return first ?? data?.message ?? fallback
  }
  return fallback
}

export function AgendaPage() {
  const { data: me } = useMe()
  const specialists = useSpecialists()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Google Calendar abre en semana en escritorio y en día en móvil.
  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
      ? 'week'
      : 'day',
  )
  const [cursor, setCursor] = useState<Date>(startOfDay(new Date()))
  const [specialistFilter, setSpecialistFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null)
  const [slotDate, setSlotDate] = useState<Date | null>(null)
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean
    block: AgendaBlock | null
    initialDate?: Date | null
  }>({ open: false, block: null })

  const days = useMemo(() => {
    if (view === 'day') return [startOfDay(cursor)]
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [view, cursor])

  const range = useMemo(
    () => ({
      from: startOfDay(days[0]!),
      to: endOfDay(days[days.length - 1]!),
    }),
    [days],
  )

  const appts = useAppointments({
    date_from: range.from.toISOString(),
    date_to: range.to.toISOString(),
    specialist_id:
      specialistFilter !== 'all' ? Number(specialistFilter) : undefined,
  })
  const blocksQuery = useAgendaBlocks({
    date_from: range.from.toISOString(),
    date_to: range.to.toISOString(),
    specialist_id:
      specialistFilter !== 'all' ? Number(specialistFilter) : undefined,
  })

  const changeStatus = useChangeAppointmentStatus(editingAppt?.id ?? 0)
  const reschedule = useRescheduleAppointment()

  const navigate = (delta: -1 | 1) => {
    setCursor((d) => addDays(d, view === 'day' ? delta : delta * 7))
  }

  const onSelectAppointment = (a: Appointment) => {
    setEditingAppt(a)
    setSlotDate(null)
  }

  const onPickSlot = (slot: Date) => {
    if (slot.getTime() < Date.now()) {
      toast.error('No se puede agendar en una fecha u hora pasada')
      return
    }
    setEditingAppt(null)
    setSlotDate(slot)
    setDialogOpen(true)
  }

  const onChangeStatus = (status: AppointmentStatus) => {
    if (!editingAppt) return
    changeStatus.mutate(status, {
      onSuccess: () => toast.success('Estado actualizado'),
      onError: () => toast.error('No fue posible cambiar el estado'),
    })
  }

  const canManageAgenda = me?.permissions.includes('appointments.manage') ?? false

  const onReschedule = (appt: Appointment, startsAt: Date, endsAt: Date) => {
    reschedule.mutate(
      {
        id: appt.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      },
      {
        onSuccess: () =>
          toast.success(
            `Cita reprogramada — ${startsAt.toLocaleString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
          ),
        onError: (err) => toast.error(rescheduleErrorMessage(err)),
      },
    )
  }

  const title =
    view === 'day'
      ? cursor.toLocaleDateString('es-MX', {
          weekday: isDesktop ? 'long' : undefined,
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : (() => {
          const ws = startOfWeek(cursor)
          const we = addDays(ws, 6)
          return `${ws.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
        })()

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Agenda
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setBlockDialog({ open: true, block: null, initialDate: cursor })
            }
          >
            <Lock className="size-4" /> Cerrar agenda
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingAppt(null)
              setSlotDate(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="size-4" /> Nueva cita
          </Button>
        </div>
      </header>

      {/* Toolbar estilo Google Calendar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setCursor(startOfDay(new Date()))}
          >
            Hoy
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => navigate(-1)}
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-full"
              onClick={() => navigate(1)}
              aria-label="Siguiente"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <h2 className="text-base sm:text-xl font-normal text-foreground capitalize">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Especialista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los dentistas</SelectItem>
              {specialists.data?.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="day">Día</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {editingAppt ? (
        <Card className="p-4 space-y-3 border-primary/40">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Cambiar estado · {editingAppt.patient_name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(editingAppt.starts_at).toLocaleString('es-MX', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {editingAppt.treatment_name
                  ? ` · ${editingAppt.treatment_name}`
                  : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingAppt(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]
            ).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={editingAppt.status === s ? 'default' : 'outline'}
                onClick={() => onChangeStatus(s)}
                disabled={changeStatus.isPending}
              >
                {APPOINTMENT_STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
          <Button
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => setDialogOpen(true)}
          >
            Editar detalles…
          </Button>
        </Card>
      ) : null}

      {appts.isPending ? (
        <Skeleton className="h-[28rem] w-full" />
      ) : (
        <AgendaTimeGrid
          days={days}
          appointments={appts.data ?? []}
          blocks={blocksQuery.data ?? []}
          colorBySpecialist={specialistFilter === 'all'}
          selectedId={editingAppt?.id ?? null}
          onSelectAppointment={onSelectAppointment}
          onSelectBlock={(b) => setBlockDialog({ open: true, block: b })}
          onPickSlot={onPickSlot}
          onReschedule={canManageAgenda ? onReschedule : undefined}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusLegend />
        {specialistFilter === 'all' && (specialists.data?.length ?? 0) > 0 ? (
          <SpecialistsLegend specialists={specialists.data!} />
        ) : null}
      </div>

      {canManageAgenda ? <IcsFeedCard /> : null}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={slotDate}
        appointment={editingAppt}
      />

      <AgendaBlockDialog
        open={blockDialog.open}
        onOpenChange={(o) =>
          setBlockDialog((prev) => ({ ...prev, open: o }))
        }
        block={blockDialog.block}
        initialDate={blockDialog.initialDate}
      />
    </div>
  )
}

function SpecialistsLegend({
  specialists,
}: {
  specialists: { id: number; name: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {specialists.map((s) => {
        const c = colorForSpecialist(s.id)
        return (
          <span
            key={s.id}
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-medium',
              c.text,
            )}
          >
            <span className={cn('inline-block size-2.5 rounded-full', c.dot)} />
            {s.name}
          </span>
        )
      })}
    </div>
  )
}
