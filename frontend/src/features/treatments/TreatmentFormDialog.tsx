import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateTreatment, useUpdateTreatment } from './hooks'
import type { Treatment } from '@/shared/types/catalog'
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

const schema = z.object({
  code: z.string().max(32),
  name: z.string().min(1, 'Requerido').max(255),
  category: z.string().max(60),
  description: z.string().max(2000),
  base_price: z.coerce.number().min(0, 'Debe ser ≥ 0'),
  duration_minutes: z.coerce.number().int().min(5).max(600),
  commission_percent: z.union([z.literal(''), z.coerce.number().min(0).max(100)]),
  periodicity_days: z.union([z.literal(''), z.coerce.number().int().min(1).max(3650)]),
  recall_label: z.string().max(120),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  treatment?: Treatment | null
}

function defaults(): FormValues {
  return {
    code: '',
    name: '',
    category: '',
    description: '',
    base_price: 0,
    duration_minutes: 30,
    commission_percent: '',
    periodicity_days: '',
    recall_label: '',
  }
}

function fromTreatment(t: Treatment): FormValues {
  return {
    code: t.code ?? '',
    name: t.name,
    category: t.category ?? '',
    description: t.description ?? '',
    base_price: t.base_price,
    duration_minutes: t.duration_minutes,
    commission_percent: t.commission_percent ?? '',
    periodicity_days: t.periodicity_days ?? '',
    recall_label: t.recall_label ?? '',
  }
}

export function TreatmentFormDialog({ open, onOpenChange, treatment }: Props) {
  const isEdit = !!treatment
  const create = useCreateTreatment()
  const update = useUpdateTreatment(treatment?.id ?? 0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaults(),
  })

  useEffect(() => {
    reset(treatment ? fromTreatment(treatment) : defaults())
  }, [treatment, reset])

  const onSubmit = (v: FormValues) => {
    const payload = {
      code: v.code || null,
      name: v.name,
      category: v.category || null,
      description: v.description || null,
      base_price: v.base_price,
      duration_minutes: v.duration_minutes,
      commission_percent: v.commission_percent === '' ? null : v.commission_percent,
      periodicity_days: v.periodicity_days === '' ? null : v.periodicity_days,
      recall_label: v.recall_label || null,
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Tratamiento actualizado' : 'Tratamiento creado')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })
                .response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar el tratamiento')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar tratamiento' : 'Nuevo tratamiento'}</DialogTitle>
          <DialogDescription>
            Define el costo base, duración estimada y comisión. La periodicidad activa los
            recordatorios automáticos de recall.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input id="code" placeholder="LIMP" {...register('code')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <Input id="category" placeholder="Preventivo" {...register('category')} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...register('name')} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea id="description" rows={2} {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="base_price">Costo base (MXN)</Label>
              <Input id="base_price" type="number" step="0.01" {...register('base_price')} />
              {errors.base_price ? (
                <p className="text-xs text-destructive">{errors.base_price.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">Duración (min)</Label>
              <Input id="duration_minutes" type="number" {...register('duration_minutes')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission_percent">Comisión (%)</Label>
              <Input
                id="commission_percent"
                type="number"
                step="0.01"
                placeholder="Por defecto del dentista"
                {...register('commission_percent')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodicity_days">Periodicidad (días)</Label>
              <Input
                id="periodicity_days"
                type="number"
                placeholder="180 = recall semestral"
                {...register('periodicity_days')}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="recall_label">Etiqueta de recall</Label>
              <Input
                id="recall_label"
                placeholder="Limpieza semestral"
                {...register('recall_label')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear tratamiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
