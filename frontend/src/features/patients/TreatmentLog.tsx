import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarClock, Loader2, NotebookPen, Plus, Trash2 } from 'lucide-react'
import {
  useAddTreatmentLogEntry,
  useDeleteTreatmentLogEntry,
  useTreatmentLog,
} from './useOdontogram'
import { useTreatments } from '@/features/treatments/hooks'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { PERMANENT_TEETH, type TreatmentLogEntry } from '@/shared/types/odontogram'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

function todayISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function TreatmentLog({
  patientId,
  defaultToothNumber = null,
}: {
  patientId: number
  defaultToothNumber?: number | null
}) {
  const { data: me } = useMe()
  const canEdit = me?.permissions.includes('clinical.manage') ?? false
  const isAdmin = me?.roles.includes('admin') ?? false

  const log = useTreatmentLog(patientId)
  const treatments = useTreatments({ only_active: true })
  const add = useAddTreatmentLogEntry(patientId)
  const del = useDeleteTreatmentLogEntry(patientId)
  const confirm = useConfirm()

  const [open, setOpen] = useState(false)
  const [performedOn, setPerformedOn] = useState(todayISO())
  const [toothNumber, setToothNumber] = useState<string>(
    defaultToothNumber ? String(defaultToothNumber) : 'none',
  )
  const [treatmentId, setTreatmentId] = useState<string>('none')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  const resetForm = () => {
    setPerformedOn(todayISO())
    setToothNumber(defaultToothNumber ? String(defaultToothNumber) : 'none')
    setTreatmentId('none')
    setDescription('')
    setNotes('')
  }

  const onTreatmentChange = (v: string) => {
    setTreatmentId(v)
    // Si el usuario aún no escribe descripción, prellenamos con el tratamiento.
    if (v !== 'none' && !description.trim()) {
      const t = treatments.data?.find((x) => String(x.id) === v)
      if (t) setDescription(t.name)
    }
  }

  const onAdd = () => {
    if (!description.trim()) {
      toast.error('Describe el tratamiento realizado')
      return
    }
    add.mutate(
      {
        performed_on: performedOn,
        tooth_number: toothNumber !== 'none' ? Number(toothNumber) : null,
        treatment_id: treatmentId !== 'none' ? Number(treatmentId) : null,
        description: description.trim(),
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Tratamiento registrado en la bitácora')
          resetForm()
          setOpen(false)
        },
        onError: () => toast.error('No fue posible registrar el tratamiento'),
      },
    )
  }

  const onDelete = async (entry: TreatmentLogEntry) => {
    const ok = await confirm({
      title: '¿Eliminar este registro de la bitácora?',
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    del.mutate(entry.id, {
      onSuccess: () => toast.success('Registro eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  const entries = log.data ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <NotebookPen className="size-4 text-primary" />
            Bitácora de tratamientos
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Registro cronológico de los tratamientos realizados (NOM-004).
          </p>
        </div>
        {canEdit ? (
          <Button size="sm" variant={open ? 'outline' : 'default'} onClick={() => setOpen((v) => !v)}>
            <Plus className="size-4" /> {open ? 'Cerrar' : 'Registrar'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {open && canEdit ? (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tl-date">Fecha</Label>
                <Input
                  id="tl-date"
                  type="date"
                  value={performedOn}
                  onChange={(e) => setPerformedOn(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Diente (opcional)</Label>
                <Select value={toothNumber} onValueChange={setToothNumber}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">Sin diente específico</SelectItem>
                    {PERMANENT_TEETH.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Diente {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tratamiento del catálogo (opcional)</Label>
              <Select value={treatmentId} onValueChange={onTreatmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="none">Sin vincular al catálogo</SelectItem>
                  {treatments.data?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tl-desc">Descripción</Label>
              <Input
                id="tl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Resina en cara oclusal, limpieza, extracción…"
                maxLength={255}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tl-notes">Notas (opcional)</Label>
              <Textarea
                id="tl-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Material usado, observaciones, próxima cita…"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={onAdd} disabled={add.isPending}>
                {add.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar registro
              </Button>
            </div>
          </div>
        ) : null}

        {log.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
              <CalendarClock className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Aún no hay tratamientos registrados en la bitácora.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {entries.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(e.performed_on)}
                      </span>
                      {e.tooth_number ? (
                        <Badge variant="outline" className="font-normal">
                          Diente {e.tooth_number}
                        </Badge>
                      ) : null}
                      {e.treatment_name ? (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10 font-normal">
                          {e.treatment_name}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{e.description}</p>
                    {e.notes ? (
                      <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                        {e.notes}
                      </p>
                    ) : null}
                    {e.created_by_name ? (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Registró: {e.created_by_name}
                      </p>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive shrink-0"
                      onClick={() => onDelete(e)}
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
