import { useEffect, useState } from 'react'
import { Loader2, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateAgendaBlock,
  useDeleteAgendaBlock,
  useUpdateAgendaBlock,
} from './hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { useMe } from '@/features/auth/hooks'
import type { AgendaBlock } from '@/shared/types/agenda'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  block?: AgendaBlock | null
  initialDate?: Date | null
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultStart(initial?: Date | null): Date {
  const now = new Date()
  // Si nos pasan un día sin hora (00:00 — caso típico cuando el cursor de la
  // agenda apunta al inicio del día), lo combinamos con una hora razonable
  // para no quedar fuera del horario visible (07:00–22:00).
  if (initial) {
    const d = new Date(initial)
    if (d.getHours() === 0 && d.getMinutes() === 0) {
      const isToday =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      if (isToday) {
        d.setHours(now.getHours(), 0, 0, 0)
      } else {
        d.setHours(9, 0, 0, 0) // 9 am
      }
    }
    return d
  }
  const d = new Date()
  d.setMinutes(0, 0, 0)
  return d
}

export function AgendaBlockDialog({
  open,
  onOpenChange,
  block,
  initialDate,
}: Props) {
  const isEdit = !!block
  const create = useCreateAgendaBlock()
  const update = useUpdateAgendaBlock(block?.id ?? 0)
  const del = useDeleteAgendaBlock()
  const specialists = useSpecialists()
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false

  const [title, setTitle] = useState('')
  const [scope, setScope] = useState<'global' | 'specialist'>('global')
  const [specialistId, setSpecialistId] = useState<string>('')
  const [allDay, setAllDay] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!open) return
    if (block) {
      setTitle(block.title)
      setScope(block.specialist_id ? 'specialist' : 'global')
      setSpecialistId(
        block.specialist_id ? String(block.specialist_id) : '',
      )
      setAllDay(block.all_day)
      setStartsAt(toLocalInputValue(new Date(block.starts_at)))
      setEndsAt(toLocalInputValue(new Date(block.ends_at)))
      setNotes(block.notes ?? '')
    } else {
      const start = defaultStart(initialDate)
      const end = new Date(start.getTime() + 60 * 60_000)
      setTitle('')
      setScope('global')
      setSpecialistId('')
      setAllDay(false)
      setStartsAt(toLocalInputValue(start))
      setEndsAt(toLocalInputValue(end))
      setNotes('')
    }
  }, [open, block, initialDate])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Pon una razón al bloqueo (ej. "Almuerzo")')
      return
    }
    if (scope === 'specialist' && !specialistId) {
      toast.error('Selecciona un dentista')
      return
    }
    if (!startsAt || !endsAt) {
      toast.error('Captura la fecha y hora')
      return
    }
    let payloadStart = new Date(startsAt)
    let payloadEnd = new Date(endsAt)
    if (allDay) {
      payloadStart = new Date(payloadStart)
      payloadStart.setHours(0, 0, 0, 0)
      payloadEnd = new Date(payloadEnd)
      payloadEnd.setHours(23, 59, 59, 999)
    }
    if (payloadEnd <= payloadStart) {
      toast.error('La hora de fin debe ser posterior a la de inicio')
      return
    }
    const payload = {
      title: title.trim(),
      specialist_id: scope === 'specialist' ? Number(specialistId) : null,
      all_day: allDay,
      starts_at: payloadStart.toISOString(),
      ends_at: payloadEnd.toISOString(),
      notes: notes.trim() || null,
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Bloqueo actualizado' : 'Agenda cerrada')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
            : undefined
        toast.error(errs?.message ?? 'No fue posible guardar')
      },
    })
  }

  const onDelete = () => {
    if (!block) return
    if (!window.confirm('¿Eliminar este bloqueo?')) return
    del.mutate(block.id, {
      onSuccess: () => {
        toast.success('Bloqueo eliminado')
        onOpenChange(false)
      },
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            {isEdit ? 'Editar bloqueo' : 'Cerrar agenda'}
          </DialogTitle>
          <DialogDescription>
            Bloquea un rango de horas para que no se puedan agendar citas
            (almuerzo, vacaciones, día festivo, capacitación, etc.).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="block-title">Motivo</Label>
            <Input
              id="block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Almuerzo, vacaciones, día festivo…"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Aplica a</Label>
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as 'global' | 'specialist')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Toda la clínica</SelectItem>
                <SelectItem value="specialist">Un dentista en particular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'specialist' ? (
            <div className="space-y-1.5">
              <Label>Dentista</Label>
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
          ) : null}

          <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="mt-1 size-4 accent-primary cursor-pointer"
            />
            <span className="text-sm leading-tight">
              <span className="font-medium block">Todo el día</span>
              <span className="text-xs text-muted-foreground">
                Bloquea el día completo (ignora las horas).
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-starts">Desde</Label>
              <Input
                id="block-starts"
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? startsAt.slice(0, 10) : startsAt}
                onChange={(e) => {
                  const v = e.target.value
                  setStartsAt(allDay ? `${v}T00:00` : v)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-ends">Hasta</Label>
              <Input
                id="block-ends"
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? endsAt.slice(0, 10) : endsAt}
                onChange={(e) => {
                  const v = e.target.value
                  setEndsAt(allDay ? `${v}T23:59` : v)
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="block-notes">Notas (opcional)</Label>
            <Textarea
              id="block-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row">
            {isEdit && isAdmin ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive mr-auto"
                onClick={onDelete}
                disabled={del.isPending}
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Cerrar agenda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
