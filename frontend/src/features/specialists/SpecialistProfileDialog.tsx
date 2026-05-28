import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useUpdateSpecialist } from './hooks'
import { SPECIALTIES, specialtyLabel } from './specialties'
import type { Specialist } from '@/shared/types/api'
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  specialist: Specialist
}

export function SpecialistProfileDialog({ open, onOpenChange, specialist }: Props) {
  const update = useUpdateSpecialist(specialist.id)

  const [name, setName] = useState(specialist.name)
  const [cedula, setCedula] = useState(specialist.cedula_profesional ?? '')
  const [specialty, setSpecialty] = useState(specialist.specialty ?? '')
  const [commission, setCommission] = useState<string>(
    specialist.default_commission_percent != null
      ? String(specialist.default_commission_percent)
      : '',
  )
  const [bio, setBio] = useState(specialist.bio ?? '')
  const [active, setActive] = useState(specialist.active)

  useEffect(() => {
    setName(specialist.name)
    setCedula(specialist.cedula_profesional ?? '')
    setSpecialty(specialist.specialty ?? '')
    setCommission(
      specialist.default_commission_percent != null
        ? String(specialist.default_commission_percent)
        : '',
    )
    setBio(specialist.bio ?? '')
    setActive(specialist.active)
  }, [specialist])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      {
        name,
        cedula_profesional: cedula || null,
        specialty: specialty || null,
        default_commission_percent: commission === '' ? null : Number(commission),
        bio: bio || null,
        active,
      },
      {
        onSuccess: () => {
          toast.success('Especialista actualizado')
          onOpenChange(false)
        },
        onError: () => toast.error('No fue posible guardar'),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar especialista</DialogTitle>
          <DialogDescription>
            Los datos aparecen en recetas, recibos y reportes. La firma autógrafa va al
            momento de imprimir (NOM-004).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={160}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cedula">Cédula profesional</Label>
              <Input
                id="cedula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                maxLength={32}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidad</Label>
              <Select value={specialty || 'general'} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {/* Conserva un valor de texto libre previo como opción. */}
                  {specialty && !SPECIALTIES.some((s) => s.key === specialty) ? (
                    <SelectItem value={specialty}>{specialtyLabel(specialty)}</SelectItem>
                  ) : null}
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission">Comisión por defecto (%)</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="Si lo dejas vacío, se usa la del tratamiento"
              />
            </div>
            <div className="space-y-1.5 flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="size-4 accent-primary cursor-pointer"
                />
                Activo
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio / descripción</Label>
            <Textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
