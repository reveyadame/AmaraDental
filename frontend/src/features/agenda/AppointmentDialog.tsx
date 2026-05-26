import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import {
  useCreateAppointment,
  useDeleteAppointment,
  useUpdateAppointment,
} from './hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { useTreatments } from '@/features/treatments/hooks'
import { PatientPicker } from '@/features/cash/PatientPicker'
import { useMe } from '@/features/auth/hooks'
import type { Patient } from '@/shared/types/patient'
import type { Appointment } from '@/shared/types/agenda'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date | null
  initialSpecialistId?: number | null
  initialPatient?: Patient | null
  initialTreatmentId?: number | null
  appointment?: Appointment | null
  /** Se dispara cuando se crea una nueva cita; el recall lo usa para
   *  vincular el appointment_id al recall original. */
  onCreated?: (a: Appointment) => void
}

function toLocalInputValue(d: Date): string {
  // yyyy-MM-ddTHH:mm en hora local
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInputValue(v: string): Date {
  return new Date(v)
}

export function AppointmentDialog({
  open,
  onOpenChange,
  initialDate,
  initialSpecialistId,
  initialPatient,
  initialTreatmentId,
  appointment,
  onCreated,
}: Props) {
  const isEdit = !!appointment
  const create = useCreateAppointment()
  const update = useUpdateAppointment(appointment?.id ?? 0)
  const del = useDeleteAppointment()

  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false

  const specialists = useSpecialists()
  const treatments = useTreatments({ only_active: true })

  const [patient, setPatient] = useState<Patient | null>(initialPatient ?? null)
  const [specialistId, setSpecialistId] = useState<string>(
    initialSpecialistId ? String(initialSpecialistId) : '',
  )
  const [treatmentId, setTreatmentId] = useState<string>('')
  const [start, setStart] = useState<string>(
    initialDate ? toLocalInputValue(initialDate) : toLocalInputValue(new Date()),
  )
  const [duration, setDuration] = useState<number>(30)
  const [room, setRoom] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (appointment) {
      setPatient(null) // se rellena por nombre debajo si quieres mostrarlo, no requerido para edit
      setSpecialistId(String(appointment.specialist_id))
      setTreatmentId(appointment.treatment_id ? String(appointment.treatment_id) : '')
      setStart(toLocalInputValue(new Date(appointment.starts_at)))
      const min = appointment.duration_minutes ?? 30
      setDuration(min > 0 ? min : 30)
      setRoom(appointment.room ?? '')
      setNotes(appointment.notes ?? '')
    } else {
      setPatient(initialPatient ?? null)
      setSpecialistId(initialSpecialistId ? String(initialSpecialistId) : '')
      setTreatmentId(initialTreatmentId ? String(initialTreatmentId) : '')
      setStart(initialDate ? toLocalInputValue(initialDate) : toLocalInputValue(new Date()))
      setDuration(30)
      setRoom('')
      setNotes('')
    }
  }, [open, appointment, initialDate, initialPatient, initialSpecialistId, initialTreatmentId])

  // Auto-ajusta duración cuando eliges tratamiento (en alta).
  useEffect(() => {
    if (isEdit || !treatmentId) return
    const t = treatments.data?.find((x) => x.id === Number(treatmentId))
    if (t && t.duration_minutes) setDuration(t.duration_minutes)
  }, [treatmentId, treatments.data, isEdit])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isEdit && !patient) {
      toast.error('Selecciona un paciente')
      return
    }
    if (!specialistId) {
      toast.error('Selecciona un especialista')
      return
    }
    if (!start) {
      toast.error('Captura la fecha y hora')
      return
    }
    if (duration <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }

    const startsAt = fromLocalInputValue(start)
    const endsAt = new Date(startsAt.getTime() + duration * 60_000)

    const payload = {
      ...(patient ? { patient_id: patient.id } : {}),
      specialist_id: Number(specialistId),
      treatment_id: treatmentId ? Number(treatmentId) : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      room: room || null,
      notes: notes || null,
    }

    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: (created) => {
        toast.success(isEdit ? 'Cita actualizada' : 'Cita creada')
        if (!isEdit && onCreated && created) {
          onCreated(created as Appointment)
        }
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as {
                response?: { data?: { errors?: Record<string, string[]>; message?: string } }
              }).response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar la cita')
      },
    })
  }

  const onDelete = () => {
    if (!appointment) return
    if (!window.confirm('¿Eliminar esta cita? Esta acción no se puede deshacer.')) return
    del.mutate(appointment.id, {
      onSuccess: () => {
        toast.success('Cita eliminada')
        onOpenChange(false)
      },
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cita' : 'Nueva cita'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica los datos de la cita. Los cambios quedan registrados en la bitácora.'
              : 'Agenda una cita con paciente, especialista y tratamiento.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit ? (
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <PatientPicker selected={patient} onSelect={setPatient} />
            </div>
          ) : (
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Paciente</p>
              <p className="font-medium">{appointment?.patient_name ?? '—'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Especialista</Label>
              <Select value={specialistId} onValueChange={setSpecialistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {specialists.data?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tratamiento (opcional)</Label>
              <Select
                value={treatmentId || 'none'}
                onValueChange={(v) => setTreatmentId(v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tratamiento</SelectItem>
                  {treatments.data?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="start">Fecha y hora</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Math.max(5, Number(e.target.value) || 30))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room">Consultorio / sala (opcional)</Label>
            <Input
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Consultorio 1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div>
              {isEdit && isAdmin ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive"
                  onClick={onDelete}
                  disabled={del.isPending}
                >
                  <Trash2 className="size-4" /> Eliminar
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEdit ? 'Guardar cambios' : 'Agendar cita'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
