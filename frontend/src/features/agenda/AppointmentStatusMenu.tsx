import { Check, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { useQuickChangeAppointmentStatus } from './hooks'
import {
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
  type AppointmentStatus,
} from '@/shared/types/agenda'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

const STATUS_DOT: Record<string, string> = {
  scheduled: 'bg-slate-400',
  confirmed: 'bg-primary',
  arrived: 'bg-amber-400',
  in_room: 'bg-amber-600',
  completed: 'bg-emerald-500',
  no_show: 'bg-rose-500',
  cancelled: 'bg-muted-foreground',
}

interface Props {
  appointment: Appointment
  /** Si se proporciona, se renderiza un `trigger` personalizado (ej. botón
   *  invisible para abrir el menú desde una zona externa); si no, se usa el
   *  botón de tres puntos por defecto. */
  trigger?: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

export function AppointmentStatusMenu({
  appointment,
  trigger,
  align = 'end',
}: Props) {
  const mutation = useQuickChangeAppointmentStatus()

  const onChange = (status: AppointmentStatus) => {
    if (status === appointment.status) return
    mutation.mutate(
      { id: appointment.id, status },
      {
        onSuccess: () =>
          toast.success(
            `Estado: ${APPOINTMENT_STATUS_LABELS[status]}`,
          ),
        onError: () => toast.error('No fue posible cambiar el estado'),
      },
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        // Evita que el click se propague al botón de la cita.
        onClick={(e) => e.stopPropagation()}
      >
        {trigger ?? (
          <button
            type="button"
            className="opacity-70 hover:opacity-100 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition"
            aria-label="Cambiar estado de la cita"
          >
            <MoreVertical className="size-3.5" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="w-52"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs">
          Cambiar estado
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map(
          (s) => {
            const active = appointment.status === s
            return (
              <DropdownMenuItem
                key={s}
                onSelect={(e) => {
                  e.preventDefault()
                  onChange(s)
                }}
                className="gap-2"
                disabled={mutation.isPending}
              >
                <span
                  className={cn(
                    'inline-block size-2 rounded-full shrink-0',
                    STATUS_DOT[s] ?? 'bg-muted',
                  )}
                />
                <span className="flex-1">
                  {APPOINTMENT_STATUS_LABELS[s]}
                </span>
                {active ? <Check className="size-3.5 text-primary" /> : null}
              </DropdownMenuItem>
            )
          },
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
