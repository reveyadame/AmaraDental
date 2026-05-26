import { useEffect, useState } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateLab, useUpdateLab } from './hooks'
import type { Lab } from '@/shared/types/lab'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lab?: Lab | null
}

export function LabFormDialog({ open, onOpenChange, lab }: Props) {
  const isEdit = !!lab
  const create = useCreateLab()
  const update = useUpdateLab(lab?.id ?? 0)

  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    if (!open) return
    if (lab) {
      setName(lab.name)
      setContactName(lab.contact_name ?? '')
      setPhone(lab.phone ?? '')
      setEmail(lab.email ?? '')
      setAddress(lab.address ?? '')
      setNotes(lab.notes ?? '')
      setActive(lab.active)
    } else {
      setName('')
      setContactName('')
      setPhone('')
      setEmail('')
      setAddress('')
      setNotes('')
      setActive(true)
    }
  }, [open, lab])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre del laboratorio es obligatorio')
      return
    }
    const payload = {
      name: name.trim(),
      contact_name: contactName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      active,
    }
    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Laboratorio actualizado' : 'Laboratorio creado')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
                .response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar el laboratorio')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            {isEdit ? 'Editar laboratorio' : 'Nuevo laboratorio'}
          </DialogTitle>
          <DialogDescription>
            Datos de contacto del laboratorio dental. Aparece como opción al crear
            órdenes de trabajo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lab-name">Nombre</Label>
            <Input
              id="lab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lab Dental ABC"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lab-contact">Persona de contacto</Label>
              <Input
                id="lab-contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lab-phone">Teléfono</Label>
              <Input
                id="lab-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lab-email">Correo</Label>
              <Input
                id="lab-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lab-address">Dirección</Label>
              <Input
                id="lab-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lab-notes">Notas</Label>
            <Textarea
              id="lab-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tiempos de entrega, especialidades, condiciones de pago…"
            />
          </div>

          <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-primary cursor-pointer"
            />
            <span className="text-sm">
              Laboratorio <span className="font-medium">{active ? 'activo' : 'inactivo'}</span>
              <span className="block text-xs text-muted-foreground">
                Solo los activos aparecen al crear órdenes nuevas.
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear laboratorio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
