import { useEffect, useState } from 'react'
import { Loader2, Microscope } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateLabOrder, useLabs, useUpdateLabOrder } from './hooks'
import { PatientPicker } from '@/features/cash/PatientPicker'
import { useTreatments } from '@/features/treatments/hooks'
import { useSpecialists } from '@/features/specialists/hooks'
import type { LabOrder, LabOrderStatus } from '@/shared/types/lab'
import { LAB_ORDER_STATUS_LABELS } from '@/shared/types/lab'
import type { Patient } from '@/shared/types/patient'
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
  order?: LabOrder | null
  presetPatient?: Patient | null
}

interface FormState {
  patient: Patient | null
  treatment_id: string
  specialist_id: string
  lab_id: string
  lab_name: string
  work_type: string
  specifications: string
  sent_on: string
  due_on: string
  received_on: string
  delivered_to_patient_on: string
  cost: string
  status: LabOrderStatus
  notes: string
}

function emptyForm(): FormState {
  return {
    patient: null,
    treatment_id: '',
    specialist_id: '',
    lab_id: '',
    lab_name: '',
    work_type: '',
    specifications: '',
    sent_on: '',
    due_on: '',
    received_on: '',
    delivered_to_patient_on: '',
    cost: '',
    status: 'pending',
    notes: '',
  }
}

export function LabOrderFormDialog({
  open,
  onOpenChange,
  order,
  presetPatient,
}: Props) {
  const isEdit = !!order
  const create = useCreateLabOrder()
  const update = useUpdateLabOrder(order?.id ?? 0)
  const treatments = useTreatments({ only_active: true })
  const specialists = useSpecialists()
  const labs = useLabs({ only_active: true })

  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (!open) return
    if (order) {
      setForm({
        patient: order.patient_name
          ? ({
              id: order.patient_id,
              first_name: order.patient_name.split(' ')[0] ?? '',
              last_name: order.patient_name.split(' ').slice(1).join(' '),
              full_name: order.patient_name,
            } as unknown as Patient)
          : null,
        treatment_id: order.treatment_id ? String(order.treatment_id) : '',
        specialist_id: order.specialist_id
          ? String(order.specialist_id)
          : '',
        lab_id: order.lab_id ? String(order.lab_id) : '',
        lab_name: order.lab_name,
        work_type: order.work_type ?? '',
        specifications: order.specifications ?? '',
        sent_on: order.sent_on ?? '',
        due_on: order.due_on ?? '',
        received_on: order.received_on ?? '',
        delivered_to_patient_on: order.delivered_to_patient_on ?? '',
        cost: String(order.cost ?? ''),
        status: order.status,
        notes: order.notes ?? '',
      })
    } else {
      setForm({ ...emptyForm(), patient: presetPatient ?? null })
    }
  }, [open, order, presetPatient])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patient) {
      toast.error('Selecciona un paciente')
      return
    }
    if (!form.lab_id && !form.lab_name.trim()) {
      toast.error('Selecciona o indica el laboratorio')
      return
    }
    const payload = {
      patient_id: form.patient.id,
      treatment_id: form.treatment_id ? Number(form.treatment_id) : null,
      specialist_id: form.specialist_id ? Number(form.specialist_id) : null,
      lab_id: form.lab_id ? Number(form.lab_id) : null,
      lab_name: form.lab_name.trim() || null,
      work_type: form.work_type.trim() || null,
      specifications: form.specifications.trim() || null,
      sent_on: form.sent_on || null,
      due_on: form.due_on || null,
      received_on: form.received_on || null,
      delivered_to_patient_on: form.delivered_to_patient_on || null,
      cost: form.cost !== '' ? Number(form.cost) : 0,
      status: form.status,
      notes: form.notes.trim() || null,
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Orden actualizada' : 'Orden creada')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
                .response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar la orden')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Microscope className="size-5 text-primary" />
            {isEdit ? 'Editar orden de laboratorio' : 'Nueva orden de laboratorio'}
          </DialogTitle>
          <DialogDescription>
            Registra la pieza enviada al laboratorio externo, sus fechas y costo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <PatientPicker
              selected={form.patient}
              onSelect={(p) => setForm((f) => ({ ...f, patient: p }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Laboratorio</Label>
              <Select
                value={form.lab_id || 'free'}
                onValueChange={(v) => {
                  if (v === 'free') {
                    setForm((f) => ({ ...f, lab_id: '' }))
                  } else {
                    const lab = labs.data?.find((l) => String(l.id) === v)
                    setForm((f) => ({
                      ...f,
                      lab_id: v,
                      lab_name: lab?.name ?? f.lab_name,
                    }))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona del catálogo…" />
                </SelectTrigger>
                <SelectContent>
                  {(labs.data ?? []).map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="free">Otro / escribir libre…</SelectItem>
                </SelectContent>
              </Select>
              {!form.lab_id ? (
                <Input
                  value={form.lab_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lab_name: e.target.value }))
                  }
                  placeholder="Lab dental ABC"
                  className="mt-2"
                />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="work_type">Tipo de trabajo</Label>
              <Input
                id="work_type"
                value={form.work_type}
                onChange={(e) => setForm((f) => ({ ...f, work_type: e.target.value }))}
                placeholder="Corona zirconio molar 36"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tratamiento</Label>
              <Select
                value={form.treatment_id || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, treatment_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin tratamiento asociado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin tratamiento asociado</SelectItem>
                  {treatments.data?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dentista</Label>
              <Select
                value={form.specialist_id || 'none'}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, specialist_id: v === 'none' ? '' : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {specialists.data?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specifications">Especificaciones</Label>
            <Textarea
              id="specifications"
              rows={2}
              value={form.specifications}
              onChange={(e) => setForm((f) => ({ ...f, specifications: e.target.value }))}
              placeholder="Color VITA A2, material, tono, indicaciones especiales…"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sent_on">Enviada</Label>
              <Input
                id="sent_on"
                type="date"
                value={form.sent_on}
                onChange={(e) => setForm((f) => ({ ...f, sent_on: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_on">Esperada</Label>
              <Input
                id="due_on"
                type="date"
                value={form.due_on}
                onChange={(e) => setForm((f) => ({ ...f, due_on: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="received_on">Recibida</Label>
              <Input
                id="received_on"
                type="date"
                value={form.received_on}
                onChange={(e) => setForm((f) => ({ ...f, received_on: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivered_to_patient_on">Entregada</Label>
              <Input
                id="delivered_to_patient_on"
                type="date"
                value={form.delivered_to_patient_on}
                onChange={(e) =>
                  setForm((f) => ({ ...f, delivered_to_patient_on: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cost">Costo (MXN) — opcional</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground">
                Déjalo vacío si aún no conoces el costo; puedes registrarlo después.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as LabOrderStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LAB_ORDER_STATUS_LABELS) as LabOrderStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {LAB_ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones, número de guía, retrabajo…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear orden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
