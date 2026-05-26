import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreatePatient, useUpdatePatient } from './hooks'
import type { Patient } from '@/shared/types/patient'
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
import { Loader2 } from 'lucide-react'

/*
 * Para todos los campos opcionales usamos `z.string().max(N)` (no `.optional()`)
 * y dejamos `''` como "vacío". `stripEmpty()` lo convierte a `null` antes de
 * enviar. Esto evita conflictos de tipos entre los defaults y el output del
 * resolver de zod (RHF compara required vs optional estrictamente).
 */
const patientSchema = z.object({
  first_name: z.string().min(1, 'Requerido').max(120),
  last_name: z.string().min(1, 'Requerido').max(120),
  date_of_birth: z.string().min(1, 'Requerido'),
  gender: z.enum(['M', 'F', 'Otro']),
  curp: z.string().max(18),
  rfc: z.string().max(13),
  email: z.string().max(255).refine((v) => v === '' || /.+@.+\..+/.test(v), 'Correo inválido'),
  phone: z.string().max(32),
  mobile_phone: z.string().max(32),
  address: z.string().max(500),
  city: z.string().max(120),
  state: z.string().max(120),
  postal_code: z.string().max(10),
  emergency_contact_name: z.string().max(160),
  emergency_contact_phone: z.string().max(32),
  occupation: z.string().max(120),
  referred_by: z.string().max(160),
  notes: z.string().max(5000),
})

type PatientForm = z.infer<typeof patientSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  onSaved?: (p: Patient) => void
}

function emptyDefaults(): PatientForm {
  return {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'F',
    curp: '',
    rfc: '',
    email: '',
    phone: '',
    mobile_phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    occupation: '',
    referred_by: '',
    notes: '',
  }
}

function patientToForm(p: Patient): PatientForm {
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    date_of_birth: p.date_of_birth ?? '',
    gender: p.gender,
    curp: p.curp ?? '',
    rfc: p.rfc ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    mobile_phone: p.mobile_phone ?? '',
    address: p.address ?? '',
    city: p.city ?? '',
    state: p.state ?? '',
    postal_code: p.postal_code ?? '',
    emergency_contact_name: p.emergency_contact_name ?? '',
    emergency_contact_phone: p.emergency_contact_phone ?? '',
    occupation: p.occupation ?? '',
    referred_by: p.referred_by ?? '',
    notes: p.notes ?? '',
  }
}

function stripEmpty(o: PatientForm): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    out[k] = v === '' ? null : v
  }
  return out
}

export function PatientFormDialog({ open, onOpenChange, patient, onSaved }: Props) {
  const isEdit = !!patient
  const create = useCreatePatient()
  const update = useUpdatePatient(patient?.id ?? 0)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema) as Resolver<PatientForm>,
    defaultValues: emptyDefaults(),
  })

  useEffect(() => {
    reset(patient ? patientToForm(patient) : emptyDefaults())
  }, [patient, reset])

  const gender = watch('gender')

  const onSubmit = (values: PatientForm) => {
    if (values.curp) values.curp = values.curp.toUpperCase()
    const payload = stripEmpty(values)
    const mutation = isEdit ? update : create
    mutation.mutate(payload as never, {
      onSuccess: (p: Patient) => {
        toast.success(isEdit ? 'Paciente actualizado' : 'Paciente creado')
        onSaved?.(p)
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response
                ?.data?.errors
            : undefined
        const first = errs ? Object.values(errs)[0]?.[0] : null
        toast.error(first ?? 'No fue posible guardar el paciente')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
          <DialogDescription>
            Datos demográficos y de contacto. La historia clínica se captura desde el expediente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Identificación
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_name">Nombre(s)</Label>
                <Input id="first_name" {...register('first_name')} />
                {errors.first_name ? (
                  <p className="text-xs text-destructive">{errors.first_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="last_name">Apellidos</Label>
                <Input id="last_name" {...register('last_name')} />
                {errors.last_name ? (
                  <p className="text-xs text-destructive">{errors.last_name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
                <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                {errors.date_of_birth ? (
                  <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={gender} onValueChange={(v) => setValue('gender', v as 'M' | 'F' | 'Otro')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="curp">CURP</Label>
                <Input id="curp" maxLength={18} {...register('curp')} />
                {errors.curp ? <p className="text-xs text-destructive">{errors.curp.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rfc">RFC</Label>
                <Input id="rfc" maxLength={13} {...register('rfc')} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobile_phone">Celular</Label>
                <Input id="mobile_phone" {...register('mobile_phone')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono fijo</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occupation">Ocupación</Label>
                <Input id="occupation" {...register('occupation')} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="address">Domicilio</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" {...register('state')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postal_code">C.P.</Label>
                <Input id="postal_code" maxLength={10} {...register('postal_code')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referred_by">Referido por</Label>
                <Input id="referred_by" {...register('referred_by')} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto de emergencia
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_name">Nombre</Label>
                <Input id="emergency_contact_name" {...register('emergency_contact_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergency_contact_phone">Teléfono</Label>
                <Input id="emergency_contact_phone" {...register('emergency_contact_phone')} />
              </div>
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
