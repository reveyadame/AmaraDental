import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateSpecialist } from './hooks'
import { SPECIALTIES } from './specialties'
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

const schema = z.object({
  name: z.string().min(1, 'Requerido').max(160),
  cedula_profesional: z.string().max(32),
  specialty: z.string().max(120),
  default_commission_percent: z.union([z.literal(''), z.coerce.number().min(0).max(100)]),
  bio: z.string().max(2000),
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function defaults(): Values {
  return {
    name: '',
    cedula_profesional: '',
    specialty: 'general',
    default_commission_percent: '',
    bio: '',
  }
}

export function SpecialistCreateDialog({ open, onOpenChange }: Props) {
  const create = useCreateSpecialist()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: defaults(),
  })

  const specialty = watch('specialty')

  const onSubmit = (v: Values) => {
    create.mutate(
      {
        name: v.name,
        cedula_profesional: v.cedula_profesional || null,
        specialty: v.specialty || null,
        default_commission_percent:
          v.default_commission_percent === '' ? null : v.default_commission_percent,
        bio: v.bio || null,
        active: true,
      },
      {
        onSuccess: () => {
          toast.success('Especialista creado')
          reset(defaults())
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
          toast.error(first ?? 'No fue posible crear el especialista')
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset(defaults())
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo especialista</DialogTitle>
          <DialogDescription>
            Los especialistas son una entrada de catálogo: se referencian desde citas,
            recetas y cobros, pero no inician sesión en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" placeholder="Dra. Laura Méndez" {...register('name')} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cedula_profesional">Cédula profesional</Label>
              <Input
                id="cedula_profesional"
                {...register('cedula_profesional')}
                maxLength={32}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidad</Label>
              <Select
                value={specialty || 'general'}
                onValueChange={(v) => setValue('specialty', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_commission_percent">Comisión por defecto (%)</Label>
              <Input
                id="default_commission_percent"
                type="number"
                step="0.01"
                min={0}
                max={100}
                placeholder="Si lo dejas vacío, se usa la del tratamiento"
                {...register('default_commission_percent')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} {...register('bio')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear especialista
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
