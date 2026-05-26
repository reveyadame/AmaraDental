import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useCreateTemplate, useUpdateTemplate } from './hooks'
import type {
  PrescriptionTemplate,
  PrescriptionTemplateItem,
} from '@/shared/types/prescription'
import { ROUTES_OF_ADMINISTRATION } from '@/shared/types/prescription'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: PrescriptionTemplate | null
  /** Items pre-cargados (para "Guardar como plantilla" desde la receta). */
  initialItems?: Omit<PrescriptionTemplateItem, 'id' | 'order_index'>[]
  initialName?: string
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

function fromTemplateItem(it: PrescriptionTemplateItem): ItemDraft {
  return {
    uid: uid(),
    medication: it.medication,
    presentation: it.presentation ?? '',
    dosage: it.dosage,
    route: it.route ?? 'oral',
    frequency: it.frequency,
    duration: it.duration,
    instructions: it.instructions ?? '',
  }
}

export function PrescriptionTemplateFormDialog({
  open,
  onOpenChange,
  template,
  initialItems,
  initialName,
}: Props) {
  const isEdit = !!template
  const create = useCreateTemplate()
  const update = useUpdateTemplate(template?.id ?? 0)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([newItem()])

  useEffect(() => {
    if (!open) return
    if (template) {
      setName(template.name)
      setCategory(template.category ?? '')
      setDescription(template.description ?? '')
      setItems(
        template.items.length > 0 ? template.items.map(fromTemplateItem) : [newItem()],
      )
    } else if (initialItems && initialItems.length > 0) {
      setName(initialName ?? '')
      setCategory('')
      setDescription('')
      setItems(
        initialItems.map((it) => ({
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
    } else {
      setName('')
      setCategory('')
      setDescription('')
      setItems([newItem()])
    }
  }, [open, template, initialItems, initialName])

  const updateItem = (uid: string, patch: Partial<ItemDraft>) =>
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)))
  const removeItem = (uid: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.uid !== uid) : prev))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Captura el nombre de la plantilla')
      return
    }
    for (const [idx, it] of items.entries()) {
      if (!it.medication.trim()) {
        toast.error(`Falta el medicamento en la línea ${idx + 1}`)
        return
      }
      if (!it.dosage.trim() || !it.frequency.trim() || !it.duration.trim()) {
        toast.error(`Completa dosis, frecuencia y duración en la línea ${idx + 1}`)
        return
      }
    }

    const payload = {
      name: name.trim(),
      category: category.trim() || null,
      description: description.trim() || null,
      items: items.map((it) => ({
        medication: it.medication.trim(),
        presentation: it.presentation.trim() || null,
        dosage: it.dosage.trim(),
        route: it.route || null,
        frequency: it.frequency.trim(),
        duration: it.duration.trim(),
        instructions: it.instructions.trim() || null,
      })),
    }

    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada')
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
        toast.error(first ?? 'No fue posible guardar la plantilla')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar plantilla de receta' : 'Nueva plantilla de receta'}</DialogTitle>
          <DialogDescription>
            Las plantillas guardan combinaciones frecuentes de medicamentos para reutilizarlas
            rápidamente al emitir una receta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre de la plantilla</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Postoperatorio extracción simple"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría (opcional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Cirugía, endodoncia…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Para qué casos usar"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Medicamentos</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems((p) => [...p, newItem()])}
              >
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
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
                      value={it.medication}
                      onChange={(e) => updateItem(it.uid, { medication: e.target.value })}
                      placeholder="Amoxicilina"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Presentación</Label>
                    <Input
                      value={it.presentation}
                      onChange={(e) => updateItem(it.uid, { presentation: e.target.value })}
                      placeholder="Cápsulas 500 mg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dosis</Label>
                    <Input
                      value={it.dosage}
                      onChange={(e) => updateItem(it.uid, { dosage: e.target.value })}
                      placeholder="1 cápsula"
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
                      value={it.frequency}
                      onChange={(e) => updateItem(it.uid, { frequency: e.target.value })}
                      placeholder="Cada 8 horas"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Duración</Label>
                    <Input
                      value={it.duration}
                      onChange={(e) => updateItem(it.uid, { duration: e.target.value })}
                      placeholder="Por 7 días"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Indicaciones</Label>
                    <Input
                      value={it.instructions}
                      onChange={(e) => updateItem(it.uid, { instructions: e.target.value })}
                      placeholder="Tomar con alimentos"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

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
