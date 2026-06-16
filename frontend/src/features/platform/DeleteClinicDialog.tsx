import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, TriangleAlert } from 'lucide-react'
import { useDeleteTenant } from './hooks'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import type { PlatformTenant } from './api'

export function DeleteClinicDialog({
  tenant,
  open,
  onOpenChange,
  onDeleted,
}: {
  tenant: PlatformTenant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const del = useDeleteTenant()
  const [confirmSlug, setConfirmSlug] = useState('')

  // Reinicia el input cada vez que se abre con otra clínica.
  const key = tenant?.id ?? 'none'

  const submit = () => {
    if (!tenant) return
    del.mutate(
      { id: tenant.id, confirmSlug },
      {
        onSuccess: () => {
          toast.success('Clínica eliminada permanentemente')
          onOpenChange(false)
          onDeleted?.()
        },
        onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible eliminar la clínica')),
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmSlug('')
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-md" key={key}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-5" /> Eliminar clínica
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Esto borra <strong>permanentemente</strong> a{' '}
              <strong>{tenant?.name}</strong> y <strong>todos sus datos</strong>: pacientes,
              expedientes, cobros, usuarios y suscripción. No se puede deshacer.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-slug">
            Escribe <span className="font-mono font-semibold">{tenant?.slug}</span> para confirmar
          </Label>
          <Input
            id="confirm-slug"
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            placeholder={tenant?.slug}
            autoComplete="off"
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={confirmSlug !== tenant?.slug || del.isPending}
          >
            {del.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Eliminar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
