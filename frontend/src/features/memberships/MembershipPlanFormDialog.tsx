import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateMembershipPlan, useUpdateMembershipPlan } from './hooks'
import { useTreatments } from '@/features/treatments/hooks'
import type { MembershipPlan } from '@/shared/types/membership'
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
import { Separator } from '@/shared/ui/separator'
import { formatMXN } from '@/shared/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: MembershipPlan | null
}

interface RowState {
  treatment_id: number
  discount_percent: string // '' = incluido sin costo
  annual_quota: string // '' = ilimitado
}

export function MembershipPlanFormDialog({ open, onOpenChange, plan }: Props) {
  const isEdit = !!plan
  const create = useCreateMembershipPlan()
  const update = useUpdateMembershipPlan(plan?.id ?? 0)
  const treatments = useTreatments({ only_active: true })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [annualPrice, setAnnualPrice] = useState('0')
  const [validMonths, setValidMonths] = useState('12')
  const [defaultDiscount, setDefaultDiscount] = useState('0')
  const [active, setActive] = useState(true)
  const [rows, setRows] = useState<RowState[]>([])
  const [addTreatmentId, setAddTreatmentId] = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (plan) {
      setName(plan.name)
      setDescription(plan.description ?? '')
      setAnnualPrice(String(plan.annual_price))
      setValidMonths(String(plan.valid_months))
      setDefaultDiscount(String(plan.default_discount_percent ?? 0))
      setActive(plan.active)
      setRows(
        (plan.treatments ?? []).map((t) => ({
          treatment_id: t.id,
          discount_percent: t.discount_percent !== null ? String(t.discount_percent) : '',
          annual_quota: t.annual_quota !== null ? String(t.annual_quota) : '',
        })),
      )
    } else {
      setName('')
      setDescription('')
      setAnnualPrice('0')
      setValidMonths('12')
      setDefaultDiscount('0')
      setActive(true)
      setRows([])
    }
    setAddTreatmentId('')
  }, [open, plan])

  const availableTreatments = useMemo(() => {
    const taken = new Set(rows.map((r) => r.treatment_id))
    return (treatments.data ?? []).filter((t) => !taken.has(t.id))
  }, [treatments.data, rows])

  const onAddRow = () => {
    const id = Number(addTreatmentId)
    if (!id) return
    setRows((prev) => [
      ...prev,
      { treatment_id: id, discount_percent: '', annual_quota: '' },
    ])
    setAddTreatmentId('')
  }

  const onRemoveRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.treatment_id !== id))
  }

  const onUpdateRow = (id: number, field: keyof RowState, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.treatment_id === id ? { ...r, [field]: value } : r)),
    )
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre del plan es obligatorio')
      return
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      annual_price: Number(annualPrice) || 0,
      valid_months: Number(validMonths) || 12,
      default_discount_percent: Number(defaultDiscount) || 0,
      active,
      treatments: rows.map((r) => ({
        treatment_id: r.treatment_id,
        discount_percent: r.discount_percent === '' ? null : Number(r.discount_percent),
        annual_quota: r.annual_quota === '' ? null : Number(r.annual_quota),
      })),
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Plan actualizado' : 'Plan creado')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })
                .response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar el plan')
      },
    })
  }

  const pending = create.isPending || update.isPending

  const treatmentNameById = (id: number) =>
    treatments.data?.find((t) => t.id === id)?.name ?? `#${id}`
  const treatmentPriceById = (id: number) =>
    treatments.data?.find((t) => t.id === id)?.base_price ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar plan' : 'Nuevo plan de membresía'}</DialogTitle>
          <DialogDescription>
            Define el precio anual, vigencia y los tratamientos incluidos (sin costo o con
            descuento) para los pacientes inscritos a este plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">Nombre del plan</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Membresía oro"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beneficios del plan, condiciones, etc."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="annual_price">Precio anual (MXN)</Label>
              <Input
                id="annual_price"
                type="number"
                step="0.01"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valid_months">Vigencia (meses)</Label>
              <Input
                id="valid_months"
                type="number"
                value={validMonths}
                onChange={(e) => setValidMonths(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_discount_percent">
                Descuento default (%)
              </Label>
              <Input
                id="default_discount_percent"
                type="number"
                step="0.01"
                value={defaultDiscount}
                onChange={(e) => setDefaultDiscount(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Se aplica a tratamientos del catálogo NO listados abajo.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="active">Estado</Label>
              <Select
                value={active ? 'active' : 'inactive'}
                onValueChange={(v) => setActive(v === 'active')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tratamientos incluidos</Label>
              <p className="text-[11px] text-muted-foreground">
                Deja % vacío para incluir sin costo.
              </p>
            </div>

            <div className="flex gap-2">
              <Select value={addTreatmentId} onValueChange={setAddTreatmentId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un tratamiento…" />
                </SelectTrigger>
                <SelectContent>
                  {availableTreatments.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No hay más tratamientos para agregar
                    </div>
                  ) : (
                    availableTreatments.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} — {formatMXN(t.base_price)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={onAddRow}
                disabled={!addTreatmentId}
              >
                <Plus className="size-4" /> Añadir
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Aún no se incluyen tratamientos. Sin tratamientos, solo aplica el descuento
                default sobre todo el catálogo.
              </p>
            ) : (
              <div className="rounded-md border divide-y">
                {rows.map((r) => {
                  const price = treatmentPriceById(r.treatment_id)
                  return (
                    <div
                      key={r.treatment_id}
                      className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center"
                    >
                      <div className="sm:col-span-5">
                        <p className="text-sm font-medium">
                          {treatmentNameById(r.treatment_id)}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          Catálogo: {formatMXN(price)}
                        </p>
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Descuento %
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="vacío = sin costo"
                          value={r.discount_percent}
                          onChange={(e) =>
                            onUpdateRow(r.treatment_id, 'discount_percent', e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Cuota anual
                        </Label>
                        <Input
                          type="number"
                          placeholder="ilimitado"
                          value={r.annual_quota}
                          onChange={(e) =>
                            onUpdateRow(r.treatment_id, 'annual_quota', e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onRemoveRow(r.treatment_id)}
                          aria-label={`Quitar ${treatmentNameById(r.treatment_id)} del plan`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
