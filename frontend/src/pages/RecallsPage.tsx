import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BellRing,
  Calendar,
  CheckCircle2,
  Phone,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteRecall, useRecalls, useUpdateRecall } from '@/features/recalls/hooks'
import { AppointmentDialog } from '@/features/agenda/AppointmentDialog'
import { usePatient } from '@/features/patients/hooks'
import { useMe } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn } from '@/shared/lib/utils'
import type { Recall } from '@/shared/types/recall'
import { accent } from '@/shared/lib/module-accents'
import type { RecallWindow } from '@/features/recalls/api'

type Tab =
  | 'overdue'
  | 'this_week'
  | 'next_30'
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'dismissed'

const TAB_TO_QUERY: Record<Tab, { window?: RecallWindow; status?: string }> = {
  overdue: { window: 'overdue' },
  this_week: { window: 'this_week' },
  next_30: { window: 'next_30' },
  pending: { status: 'pending' },
  scheduled: { status: 'scheduled' },
  completed: { status: 'completed' },
  dismissed: { status: 'dismissed' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dueBadge(r: Recall) {
  const d = r.days_until_due ?? 0
  if (r.status === 'completed') {
    return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200">Completado</Badge>
  }
  if (r.status === 'dismissed') {
    return <Badge variant="secondary">Descartado</Badge>
  }
  if (r.status === 'scheduled') {
    return <Badge className="bg-primary/10 text-primary border-primary/20 border">Agendado</Badge>
  }
  if (r.is_overdue) {
    return (
      <Badge className="bg-rose-100 text-rose-900 border-rose-200 inline-flex items-center gap-1">
        <AlertTriangle className="size-3" />
        Vencido · {Math.abs(d)} d
      </Badge>
    )
  }
  if (d <= 7) {
    return (
      <Badge className="bg-amber-100 text-amber-900 border-amber-200">
        En {d} {d === 1 ? 'día' : 'días'}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="font-normal">
      En {d} días
    </Badge>
  )
}

interface ScheduleState {
  recall: Recall
}

export function RecallsPage() {
  const { data: me } = useMe()
  const canWrite = me?.permissions.includes('recalls.manage') ?? false

  const [tab, setTab] = useState<Tab>('overdue')
  const recalls = useRecalls(TAB_TO_QUERY[tab])
  const update = useUpdateRecall()
  const remove = useDeleteRecall()

  const [schedule, setSchedule] = useState<ScheduleState | null>(null)
  // Cargar el paciente cuando vamos a agendar, así el dialog tiene el objeto completo.
  const schedulingPatient = usePatient(schedule?.recall.patient_id)

  const rows = useMemo(() => recalls.data?.data ?? [], [recalls.data])

  const onSchedule = (r: Recall) => {
    setSchedule({ recall: r })
  }

  const onAfterAppointmentCreated = (appointmentId: number) => {
    if (!schedule) return
    update.mutate(
      {
        id: schedule.recall.id,
        payload: {
          scheduled_appointment_id: appointmentId,
          status: 'scheduled',
        },
      },
      {
        onSuccess: () => toast.success('Recall agendado'),
        onError: () =>
          toast.error('La cita se creó pero no fue posible vincular el recall'),
      },
    )
    setSchedule(null)
  }

  const onMarkCompleted = (r: Recall) => {
    update.mutate(
      { id: r.id, payload: { status: 'completed' } },
      {
        onSuccess: () => toast.success('Recall completado'),
        onError: () => toast.error('No fue posible actualizar'),
      },
    )
  }

  const onDismiss = (r: Recall) => {
    if (!window.confirm(`¿Descartar el recall de ${r.patient_name}?`)) return
    update.mutate(
      { id: r.id, payload: { status: 'dismissed' } },
      {
        onSuccess: () => toast.success('Recall descartado'),
        onError: () => toast.error('No fue posible actualizar'),
      },
    )
  }

  const onDelete = (r: Recall) => {
    if (!window.confirm('¿Eliminar este recall? Esta acción no se puede deshacer.'))
      return
    remove.mutate(r.id, {
      onSuccess: () => toast.success('Recall eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('recalls').badge}`}>
          <BellRing className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Recalls preventivos
          </h1>
          <p className="text-sm text-muted-foreground">
            Pacientes que deben volver según la periodicidad de sus tratamientos. Se
            generan automáticamente al cobrarse un tratamiento periódico.
          </p>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
          <TabsTrigger value="this_week">Esta semana</TabsTrigger>
          <TabsTrigger value="next_30">Próximos 30 días</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="scheduled">Agendados</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="dismissed">Descartados</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Tratamiento sugerido</TableHead>
              <TableHead className="whitespace-nowrap">Fecha sugerida</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recalls.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Sparkles className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay recalls en esta vista.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow
                  key={r.id}
                  className={cn(
                    r.is_overdue && r.status === 'pending'
                      ? 'bg-rose-50/40 dark:bg-rose-950/10'
                      : '',
                  )}
                >
                  <TableCell>
                    <Link
                      to={`/pacientes/${r.patient_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {r.patient_name ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {r.recall_label ?? r.treatment_name ?? '—'}
                    </p>
                    {r.recall_label && r.treatment_name &&
                    r.recall_label !== r.treatment_name ? (
                      <p className="text-xs text-muted-foreground">
                        {r.treatment_name}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(r.due_on)}
                  </TableCell>
                  <TableCell>{dueBadge(r)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.patient_phone ? (
                      <a
                        href={`tel:${r.patient_phone}`}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        <Phone className="size-3" />
                        {r.patient_phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {r.status === 'pending' && canWrite ? (
                      <>
                        <Button size="sm" onClick={() => onSchedule(r)}>
                          <Calendar className="size-3.5" /> Agendar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDismiss(r)}
                          title="Descartar"
                          aria-label="Descartar recall"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </>
                    ) : null}
                    {r.status === 'scheduled' && canWrite ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMarkCompleted(r)}
                        title="Marcar completado"
                      >
                        <CheckCircle2 className="size-3.5" /> Completar
                      </Button>
                    ) : null}
                    {me?.roles.includes('admin') ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(r)}
                        aria-label="Eliminar recall"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {schedule ? (
        <AppointmentDialog
          open={!!schedule}
          onOpenChange={(o) => {
            if (!o) setSchedule(null)
          }}
          initialDate={new Date(schedule.recall.due_on + 'T09:00:00')}
          initialPatient={schedulingPatient.data ?? null}
          initialTreatmentId={schedule.recall.treatment_id}
          onCreated={(appt) => onAfterAppointmentCreated(appt.id)}
        />
      ) : null}
    </div>
  )
}
