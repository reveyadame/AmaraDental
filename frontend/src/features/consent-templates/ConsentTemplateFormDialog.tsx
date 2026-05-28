import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateConsentTemplate, useUpdateConsentTemplate } from './hooks'
import type { ConsentTemplate } from '@/shared/types/patient'
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
  title: z.string().min(1, 'Requerido').max(255),
  treatment_type: z.string().max(120),
  body: z.string().min(1, 'El texto es obligatorio').max(50000),
  active: z.boolean(),
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: ConsentTemplate | null
}

function defaults(): Values {
  return { title: '', treatment_type: '', body: '', active: true }
}

function fromTemplate(t: ConsentTemplate): Values {
  return {
    title: t.title,
    treatment_type: t.treatment_type ?? '',
    body: t.body,
    active: t.active,
  }
}

export function ConsentTemplateFormDialog({ open, onOpenChange, template }: Props) {
  const isEdit = !!template
  const create = useCreateConsentTemplate()
  const update = useUpdateConsentTemplate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults(),
  })

  useEffect(() => {
    if (open) reset(template ? fromTemplate(template) : defaults())
  }, [open, template, reset])

  const active = watch('active')

  const onSubmit = (v: Values) => {
    const payload = {
      title: v.title.trim(),
      body: v.body,
      treatment_type: v.treatment_type.trim() || null,
      active: v.active,
    }
    const onDone = () => {
      toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada')
      onOpenChange(false)
    }
    const onFail = () => toast.error('No fue posible guardar la plantilla')
    if (isEdit && template) {
      update.mutate({ id: template.id, payload }, { onSuccess: onDone, onError: onFail })
    } else {
      create.mutate(payload, { onSuccess: onDone, onError: onFail })
    }
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar plantilla de consentimiento' : 'Nueva plantilla de consentimiento'}
          </DialogTitle>
          <DialogDescription>
            Estas plantillas se usan al capturar el consentimiento informado del paciente (NOM-004).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register('title')} placeholder="Ej. Consentimiento para extracción" />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="treatment_type">Tipo de tratamiento</Label>
              <Input
                id="treatment_type"
                {...register('treatment_type')}
                placeholder="Opcional — ej. Cirugía"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Texto del consentimiento</Label>
            <Textarea
              id="body"
              rows={14}
              {...register('body')}
              className="font-mono text-xs"
              placeholder="Redacta el texto. Puedes usar variables que se reemplazan al firmar."
            />
            {errors.body ? (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            ) : null}
            <p className="text-[10px] text-muted-foreground">
              Variables soportadas: {'{{paciente}}'}, {'{{clinica}}'}, {'{{tratamiento}}'}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border"
              checked={active}
              onChange={(e) => setValue('active', e.target.checked)}
            />
            Plantilla activa (visible al firmar consentimientos)
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear plantilla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
