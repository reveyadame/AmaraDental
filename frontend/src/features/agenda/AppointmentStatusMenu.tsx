import { Check, MoreVertical, Pencil, Phone, UserX } from 'lucide-react'
import { toast } from 'sonner'
import {
  useNoShowAndDiscardPatient,
  useQuickChangeAppointmentStatus,
} from './hooks'
import {
  APPOINTMENT_STATUS_LABELS,
  SELECTABLE_APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentStatus,
} from '@/shared/types/agenda'
import { useConfirm } from '@/shared/ui/confirm'
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
  /** Abre el formulario de edición de la cita. Si se omite, no se muestra la
   *  opción "Editar cita". */
  onEdit?: () => void
}

export function AppointmentStatusMenu({
  appointment,
  trigger,
  align = 'end',
  onEdit,
}: Props) {
  const mutation = useQuickChangeAppointmentStatus()
  const noShowDiscard = useNoShowAndDiscardPatient()
  const confirm = useConfirm()

  const isFirstVisit = !!appointment.patient_is_first_visit

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

  const onNoShowAndDiscard = async () => {
    const name = appointment.patient_name ?? 'el paciente'
    const ok = await confirm({
      title: `No llegó: ¿eliminar a ${name}?`,
      description:
        'Como es un paciente de primera vez, al confirmar se marca la cita como ' +
        '"No asistió" y se elimina su registro. Sus citas pendientes (si tiene ' +
        'otras) también se borrarán. Si ya tiene cobros u otra huella, solo se ' +
        'marca la cita y el paciente se conserva.',
      confirmText: 'Sí, no llegó',
      cancelText: 'Cancelar',
      variant: 'destructive',
    })
    if (!ok) return

    noShowDiscard.mutate(appointment.id, {
      onSuccess: (data) => {
        if (data.patient_deleted) {
          toast.success(`${data.patient_name} eliminado (no se presentó)`)
        } else {
          const fields = Object.keys(data.blockers).join(', ')
          toast.warning(
            `Solo se marcó como "No asistió". El paciente tiene registros (${fields}) y no se eliminó.`,
          )
        }
      },
      onError: (e: unknown) => {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            : undefined
        toast.error(msg ?? 'No fue posible aplicar la acción')
      },
    })
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
        className="w-60"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="pb-0.5">
          <span className="block truncate text-sm">
            {appointment.patient_name ?? 'Paciente'}
          </span>
          {appointment.patient_phone ? (
            <a
              href={`tel:${appointment.patient_phone}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground hover:underline"
            >
              <Phone className="size-3 shrink-0" />
              {appointment.patient_phone}
            </a>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onEdit ? (
          <>
            <DropdownMenuItem
              onSelect={() => onEdit()}
              className="gap-2"
            >
              <Pencil className="size-3.5 shrink-0" />
              <span className="flex-1">Editar cita</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Cambiar estado
        </DropdownMenuLabel>
        {SELECTABLE_APPOINTMENT_STATUSES.map(
          (s) => {
            const active = appointment.status === s
            return (
              <DropdownMenuItem
                key={s}
                onSelect={() => onChange(s)}
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

        {isFirstVisit ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal pt-1">
              Paciente de primera vez
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onNoShowAndDiscard()
              }}
              className="gap-2 text-destructive focus:text-destructive"
              disabled={noShowDiscard.isPending}
            >
              <UserX className="size-3.5 shrink-0" />
              <span className="flex-1">No llegó · eliminar paciente</span>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
