import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateDiscount, useUpdateDiscount } from './hooks'
import type { Discount } from '@/shared/types/catalog'
import { useTreatments } from '@/features/treatments/hooks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
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

const schema = z
  .object({
    name: z.string().min(1, 'Requerido').max(160),
    type: z.enum(['percent', 'amount']),
    value: z.coerce.number().min(0).max(1_000_000),
    scope: z.enum(['global', 'treatment']),
    treatment_id: z.union([z.literal(''), z.coerce.number().int().positive()]),
    valid_from: z.string(),
    valid_to: z.string(),
  })
  .refine((v) => v.scope !== 'treatment' || v.treatment_id !== '', {
    path: ['treatment_id'],
    message: 'Selecciona el tratamiento',
  })

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  discount?: Discount | null
}

function defaults(): Values {
  return {
    name: '',
    type: 'percent',
    value: 10,
    scope: 'global',
    treatment_id: '',
    valid_from: '',
    valid_to: '',
  }
}

function fromDiscount(d: Discount): Values {
  return {
    name: d.name,
    type: d.type,
    value: d.value,
    scope: d.scope,
    treatment_id: d.treatment_id ?? '',
    valid_from: d.valid_from ?? '',
    valid_to: d.valid_to ?? '',
  }
}

export function DiscountFormDialog({ open, onOpenChange, discount }: Props) {
  const isEdit = !!discount
  const create = useCreateDiscount()
  const update = useUpdateDiscount(discount?.id ?? 0)
  const treatments = useTreatments()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: defaults(),
  })

  useEffect(() => {
    reset(discount ? fromDiscount(discount) : defaults())
  }, [discount, reset])

  const type = watch('type')
  const scope = watch('scope')
  const treatmentId = watch('treatment_id')

  const onSubmit = (v: Values) => {
    const payload = {
      name: v.name,
      type: v.type,
      value: v.value,
      scope: v.scope,
      treatment_id: v.scope === 'treatment' && v.treatment_id !== '' ? Number(v.treatment_id) : null,
      valid_from: v.valid_from || null,
      valid_to: v.valid_to || null,
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Descuento actualizado' : 'Descuento creado')
        onOpenChange(false)
      },
      onError: () => toast.error('No fue posible guardar'),
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar descuento' : 'Nuevo descuento'}</DialogTitle>
          <DialogDescription>
            Los descuentos se aplican manualmente al cobrar en caja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setValue('type', v as 'percent' | 'amount')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Porcentaje (%)</SelectItem>
                  <SelectItem value="amount">Monto fijo (MXN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="value">Valor</Label>
              <Input id="value" type="number" step="0.01" {...register('value')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alcance</Label>
            <Select value={scope} onValueChange={(v) => setValue('scope', v as 'global' | 'treatment')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (cualquier tratamiento)</SelectItem>
                <SelectItem value="treatment">Solo un tratamiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'treatment' ? (
            <div className="space-y-1.5">
              <Label>Tratamiento</Label>
              <Select
                value={treatmentId === '' ? '' : String(treatmentId)}
                onValueChange={(v) => setValue('treatment_id', v ? Number(v) : '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {treatments.data?.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.treatment_id ? (
                <p className="text-xs text-destructive">{errors.treatment_id.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valid_from">Vigencia desde</Label>
              <Input id="valid_from" type="date" {...register('valid_from')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valid_to">Vigencia hasta</Label>
              <Input id="valid_to" type="date" {...register('valid_to')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear descuento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
