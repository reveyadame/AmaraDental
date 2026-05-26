import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAgendaBlocks,
  useAppointments,
  useChangeAppointmentStatus,
} from '@/features/agenda/hooks'
import { AppointmentDialog } from '@/features/agenda/AppointmentDialog'
import { AgendaBlockDialog } from '@/features/agenda/AgendaBlockDialog'
import { AgendaDayView, StatusLegend } from '@/features/agenda/AgendaDayView'
import { AgendaWeekView } from '@/features/agenda/AgendaWeekView'
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
import { Badge } from '@/shared/ui/badge'
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

export function AgendaPage() {
  const { data: me } = useMe()
  const specialists = useSpecialists()

  const [view, setView] = useState<View>('day')
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

  const range = useMemo(() => {
    if (view === 'day') {
      return { from: startOfDay(cursor), to: endOfDay(cursor) }
    }
    const start = startOfWeek(cursor)
    return { from: start, to: endOfDay(addDays(start, 6)) }
  }, [view, cursor])

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

  const navigate = (delta: -1 | 1) => {
    setCursor((d) => addDays(d, view === 'day' ? delta : delta * 7))
  }

  const onSelectAppointment = (a: Appointment) => {
    // Solo selecciona — muestra la card de cambio rápido debajo. Para abrir
    // el editor completo el usuario pulsa "Editar detalles…".
    setEditingAppt(a)
    setSlotDate(null)
  }

  const onPickSlot = (slot: Date) => {
    setEditingAppt(null)
    setSlotDate(slot)
    setDialogOpen(true)
  }

  const onPickDay = (d: Date) => {
    setEditingAppt(null)
    setSlotDate(d)
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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Citas, confirmaciones y bloqueos por dentista.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setBlockDialog({ open: true, block: null, initialDate: cursor })
            }
          >
            <Lock className="size-4" /> Cerrar agenda
          </Button>
          <Button
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

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCursor(startOfDay(new Date()))}
            >
              Hoy
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <div className="ml-2 flex items-center gap-2 text-sm">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="font-medium text-foreground capitalize">
                {view === 'day'
                  ? cursor.toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : (() => {
                      const ws = startOfWeek(cursor)
                      const we = addDays(ws, 6)
                      return `${ws.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${we.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    })()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={specialistFilter} onValueChange={setSpecialistFilter}>
              <SelectTrigger className="w-44">
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
      </Card>

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
            onClick={() => {
              setDialogOpen(true)
            }}
          >
            Editar detalles…
          </Button>
        </Card>
      ) : null}

      {appts.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : view === 'day' ? (
        <AgendaDayView
          date={cursor}
          appointments={appts.data ?? []}
          blocks={blocksQuery.data ?? []}
          colorBySpecialist={specialistFilter === 'all'}
          onSelectAppointment={onSelectAppointment}
          onSelectBlock={(b) => setBlockDialog({ open: true, block: b })}
          onPickSlot={onPickSlot}
        />
      ) : (
        <AgendaWeekView
          date={cursor}
          appointments={appts.data ?? []}
          blocks={blocksQuery.data ?? []}
          colorBySpecialist={specialistFilter === 'all'}
          onSelectAppointment={onSelectAppointment}
          onSelectBlock={(b) => setBlockDialog({ open: true, block: b })}
          onPickDay={onPickDay}
        />
      )}

      {/* Leyenda de dentistas — solo cuando se muestran todos */}
      {specialistFilter === 'all' && (specialists.data?.length ?? 0) > 0 ? (
        <SpecialistsLegend specialists={specialists.data!} />
      ) : null}

      <StatusLegend />

      {canManageAgenda ? (
        <>
          <Badge variant="outline" className="ml-1">
            Sincronización
          </Badge>
          <IcsFeedCard />
        </>
      ) : null}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          // Cerrar el diálogo no debe limpiar la selección — la card de
          // cambio rápido depende de `editingAppt`. Si el diálogo se abrió
          // para crear una cita nueva (sin editingAppt), no hay nada que
          // limpiar.
        }}
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
    <div className="rounded-md border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
        Dentistas
      </p>
      <div className="flex flex-wrap gap-3">
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
    </div>
  )
}
