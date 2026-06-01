import { CalendarClock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppointments } from '@/features/agenda/hooks'
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_VARIANT,
} from '@/shared/types/agenda'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'

// `date_from` filtra por `ends_at >= inicio del día`, así no perdemos una cita
// que ya empezó pero aún no termina.
function todayISODate(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function formatWhen(iso: string): string {
  const s = new Date(iso).toLocaleString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Línea compacta de "próxima cita" pensada para vivir DENTRO de la tarjeta de
 * datos del paciente (no como card aparte), para no empujar las pestañas.
 */
export function PatientNextAppointment({ patientId }: { patientId: number }) {
  // El index ya ordena por `starts_at` ascendente; tomamos la primera cita
  // vigente (no cancelada ni "no asistió").
  const q = useAppointments({ patient_id: patientId, date_from: todayISODate() })

  if (q.isPending) {
    return <Skeleton className="h-5 w-64" />
  }

  const next = (q.data ?? []).find(
    (a) => a.status !== 'cancelled' && a.status !== 'no_show',
  )

  if (!next) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" />
          Sin próxima cita agendada.
        </span>
        <Link
          to="/agenda"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
        >
          Ir a la agenda <ChevronRight className="size-3" />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        <span className="inline-flex items-center gap-2 text-muted-foreground shrink-0">
          <CalendarClock className="size-4 text-primary" />
          Próxima cita:
        </span>
        <span className="font-semibold text-foreground">
          {formatWhen(next.starts_at)}
        </span>
        {next.treatment_name ? (
          <span className="text-muted-foreground">· {next.treatment_name}</span>
        ) : null}
        {next.specialist_name ? (
          <span className="text-muted-foreground">· {next.specialist_name}</span>
        ) : null}
        <Badge variant={APPOINTMENT_STATUS_VARIANT[next.status]}>
          {APPOINTMENT_STATUS_LABELS[next.status]}
        </Badge>
      </div>
      <Link
        to="/agenda"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
      >
        Ver en agenda <ChevronRight className="size-3" />
      </Link>
    </div>
  )
}
