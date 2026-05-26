import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, BookmarkPlus, FileText, Loader2, Plus, ScrollText, Trash2 } from 'lucide-react'
import { useCreatePrescription } from './hooks'
import { LoadTemplateDialog } from './LoadTemplateDialog'
import { PrescriptionTemplateFormDialog } from './PrescriptionTemplateFormDialog'
import { usePatient } from '@/features/patients/hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import { useMe } from '@/features/auth/hooks'
import { ROUTES_OF_ADMINISTRATION } from '@/shared/types/prescription'
import type { PrescriptionTemplate } from '@/shared/types/prescription'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface ItemDraft {
  uid: string
  medication: string
  presentation: string
  dosage: string
  route: string
  frequency: string
  duration: string
  instructions: string
}

function uid(): string {
  return Math.random().toString(36).slice(2, 11)
}

function newItem(): ItemDraft {
  return {
    uid: uid(),
    medication: '',
    presentation: '',
    dosage: '',
    route: 'oral',
    frequency: '',
    duration: '',
    instructions: '',
  }
}

export function NewPrescriptionPage() {
  const params = useParams<{ id: string }>()
  const patientId = params.id ? Number(params.id) : undefined
  const navigate = useNavigate()
  const { data: me } = useMe()
  const patient = usePatient(patientId)
  const specialists = useSpecialists()
  const create = useCreatePrescription(patientId ?? 0)

  const canCreate = me?.permissions.includes('prescriptions.create') ?? false

  // Los especialistas ya no son usuarios — no hay default; el usuario elige.
  const defaultSpecialistId = ''

  const [specialistId, setSpecialistId] = useState<string>(defaultSpecialistId)
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem()])
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)

  useEffect(() => {
    if (defaultSpecialistId && !specialistId) {
      setSpecialistId(defaultSpecialistId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSpecialistId])

  if (!patientId || Number.isNaN(patientId)) return <Navigate to="/pacientes" replace />
  if (!canCreate) return <Navigate to={`/pacientes/${patientId}`} replace />

  const updateItem = (uid: string, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removeItem = (uid: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.uid !== uid) : prev))

  const applyTemplate = (template: PrescriptionTemplate) => {
    const hasContent = items.some(
      (it) => it.medication.trim() || it.dosage.trim() || it.frequency.trim(),
    )
    if (
      hasContent &&
      !window.confirm(
        'Cargar la plantilla reemplazará los medicamentos actuales. ¿Continuar?',
      )
    ) {
      return
    }
    setItems(
      template.items.map((it) => ({
        uid: uid(),
        medication: it.medication,
        presentation: it.presentation ?? '',
        dosage: it.dosage,
        route: it.route ?? 'oral',
        frequency: it.frequency,
        duration: it.duration,
        instructions: it.instructions ?? '',
      })),
    )
    if (template.description && !notes) {
      setNotes(template.description)
    }
    toast.success(`Plantilla "${template.name}" cargada`)
  }

  const itemsForTemplate = items
    .filter((it) => it.medication.trim() && it.dosage.trim())
    .map((it) => ({
      medication: it.medication.trim(),
      presentation: it.presentation.trim() || null,
      dosage: it.dosage.trim(),
      route: (it.route as never) || null,
      frequency: it.frequency.trim(),
      duration: it.duration.trim(),
      instructions: it.instructions.trim() || null,
    }))

  const validate = (): string | null => {
    if (!specialistId) return 'Selecciona el dentista que prescribe'
    if (items.length === 0) return 'Agrega al menos un medicamento'
    for (const [idx, it] of items.entries()) {
      if (!it.medication.trim()) return `Falta el medicamento en la línea ${idx + 1}`
      if (!it.dosage.trim()) return `Falta la dosis en la línea ${idx + 1}`
      if (!it.frequency.trim()) return `Falta la frecuencia en la línea ${idx + 1}`
      if (!it.duration.trim()) return `Falta la duración en la línea ${idx + 1}`
    }
    return null
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    create.mutate(
      {
        specialist_id: Number(specialistId),
        diagnosis: diagnosis || null,
        notes: notes || null,
        items: items.map((it) => ({
          medication: it.medication.trim(),
          presentation: it.presentation.trim() || null,
          dosage: it.dosage.trim(),
          route: it.route || null,
          frequency: it.frequency.trim(),
          duration: it.duration.trim(),
          instructions: it.instructions.trim() || null,
        })),
      },
      {
        onSuccess: (rx) => {
          toast.success('Receta emitida')
          // Abrir versión imprimible y volver al expediente.
          window.open(`/recetas/${rx.id}/imprimir`, '_blank', 'noopener')
          navigate(`/pacientes/${patientId}`, { replace: true })
        },
        onError: (err: unknown) => {
          const errs =
            err && typeof err === 'object' && 'response' in err
              ? (err as {
                  response?: { data?: { errors?: Record<string, string[]>; message?: string } }
                }).response?.data
              : undefined
          const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
          toast.error(first ?? 'No fue posible emitir la receta')
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <Link
        to={`/pacientes/${patientId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Expediente del paciente
      </Link>

      <header className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <ScrollText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Nueva receta
          </h1>
          {patient.isPending ? (
            <Skeleton className="h-4 w-40 mt-1" />
          ) : patient.data ? (
            <p className="text-sm text-muted-foreground">
              Para {patient.data.full_name}
              {patient.data.age != null ? ` · ${patient.data.age} años` : ''}
            </p>
          ) : null}
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Dentista que prescribe</Label>
              <Select value={specialistId} onValueChange={setSpecialistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {specialists.data?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                      {s.cedula_profesional ? ` · Céd. ${s.cedula_profesional}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Su nombre, cédula y especialidad aparecerán en la receta impresa.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">Diagnóstico (opcional)</Label>
              <Textarea
                id="diagnosis"
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Medicamentos</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLoadTemplateOpen(true)}
              >
                <FileText className="size-4" /> Cargar plantilla
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSaveTemplateOpen(true)}
                disabled={itemsForTemplate.length === 0}
                title={
                  itemsForTemplate.length === 0
                    ? 'Captura al menos un medicamento para guardar como plantilla'
                    : 'Guardar como plantilla'
                }
              >
                <BookmarkPlus className="size-4" /> Guardar como plantilla
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems((p) => [...p, newItem()])}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((it, idx) => (
              <div key={it.uid} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Medicamento {idx + 1}
                  </p>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(it.uid)}
                      className="text-muted-foreground hover:text-destructive p-1 -mr-1"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Medicamento</Label>
                    <Input
                      placeholder="Amoxicilina"
                      value={it.medication}
                      onChange={(e) => updateItem(it.uid, { medication: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Presentación</Label>
                    <Input
                      placeholder="Cápsulas 500 mg"
                      value={it.presentation}
                      onChange={(e) => updateItem(it.uid, { presentation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dosis</Label>
                    <Input
                      placeholder="1 cápsula"
                      value={it.dosage}
                      onChange={(e) => updateItem(it.uid, { dosage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vía</Label>
                    <Select
                      value={it.route}
                      onValueChange={(v) => updateItem(it.uid, { route: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUTES_OF_ADMINISTRATION.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frecuencia</Label>
                    <Input
                      placeholder="Cada 8 horas"
                      value={it.frequency}
                      onChange={(e) => updateItem(it.uid, { frequency: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duración</Label>
                    <Input
                      placeholder="Por 7 días"
                      value={it.duration}
                      onChange={(e) => updateItem(it.uid, { duration: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Indicaciones específicas</Label>
                    <Input
                      placeholder="Tomar con alimentos"
                      value={it.instructions}
                      onChange={(e) => updateItem(it.uid, { instructions: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicaciones generales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reposo, dieta blanda, signos de alarma, etc."
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/pacientes/${patientId}`)}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Emitir receta
          </Button>
        </div>
      </form>

      <LoadTemplateDialog
        open={loadTemplateOpen}
        onOpenChange={setLoadTemplateOpen}
        onSelect={applyTemplate}
      />

      <PrescriptionTemplateFormDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        initialItems={itemsForTemplate}
      />
    </div>
  )
}
