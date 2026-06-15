import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Loader2, Send, ShieldOff, Smartphone } from 'lucide-react'
import { useAuth } from '@/shared/auth/permissions'
import { useConfirm } from '@/shared/ui/confirm'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { Patient } from '@/shared/types/patient'
import { useSubscription } from '@/features/subscription/hooks'
import { useInvitePortal, usePortalAccess, useRevokePortal } from './hooks'

/**
 * Botón compacto en el encabezado del paciente que abre un diálogo para
 * gestionar su acceso a la app móvil (invitar / reenviar código / revocar).
 * El estado del portal solo se consulta al abrir, para no pegar a la API en
 * cada ficha. Solo visible para quien gestiona pacientes (patients.manage);
 * revocar es admin-only.
 */
export function PatientPortalButton({ patient }: { patient: Patient }) {
  const { can, isAdmin } = useAuth()
  const canManage = can('patients.manage')
  const subscription = useSubscription()
  const [open, setOpen] = useState(false)

  const access = usePortalAccess(patient.id, canManage && open)
  const invite = useInvitePortal(patient.id)
  const revoke = useRevokePortal(patient.id)
  const confirm = useConfirm()

  // Solo se muestra si el plan de la clínica incluye la app de pacientes.
  if (!canManage || subscription.data?.includes_app !== true) return null

  const status = access.data?.status ?? null
  const hasEmail = !!patient.email
  const busy = invite.isPending || revoke.isPending

  const onInvite = () =>
    invite.mutate(undefined, {
      onSuccess: () =>
        toast.success(
          status === 'active'
            ? 'Código reenviado al correo del paciente.'
            : 'Invitación enviada al correo del paciente.',
        ),
      onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible enviar la invitación')),
    })

  const onRevoke = async () => {
    const ok = await confirm({
      title: '¿Revocar acceso al portal?',
      description:
        'El paciente dejará de poder entrar a la app. Podrás volver a invitarlo cuando quieras.',
      variant: 'destructive',
      confirmText: 'Revocar acceso',
    })
    if (!ok) return
    revoke.mutate(undefined, {
      onSuccess: () => toast.success('Acceso al portal revocado.'),
      onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible revocar el acceso')),
    })
  }

  const lastLogin = access.data?.last_login_at
    ? new Date(access.data.last_login_at).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Smartphone className="size-4" /> Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="size-4" /> Acceso al portal
          </DialogTitle>
          <DialogDescription>
            Acceso del paciente a la app para consultar sus citas, saldo y recetas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {access.isPending ? (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="size-3 animate-spin" /> Consultando…
            </Badge>
          ) : status === 'active' ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="size-3" /> Activo
            </Badge>
          ) : status === 'pending' ? (
            <Badge variant="outline" className="gap-1">
              <Clock className="size-3" /> Invitación enviada
            </Badge>
          ) : (
            <Badge variant="outline">Sin acceso</Badge>
          )}
          {status === 'active' && lastLogin ? (
            <span className="text-xs text-muted-foreground">Último ingreso: {lastLogin}</span>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          {status === 'active'
            ? 'El paciente ya activó su acceso.'
            : status === 'pending'
              ? 'Se envió un código por correo. El acceso queda activo cuando el paciente lo verifica.'
              : 'Invita al paciente para que entre a la app con un código que recibirá por correo.'}
        </p>

        {!hasEmail ? (
          <p className="text-sm text-destructive">
            Este paciente no tiene correo registrado. Agrégalo para poder invitarlo.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={onInvite} disabled={busy}>
              {invite.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {status === 'active'
                ? 'Reenviar código'
                : status === 'pending'
                  ? 'Reenviar invitación'
                  : 'Invitar al portal'}
            </Button>

            {status && isAdmin ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onRevoke}
                disabled={busy}
                className="text-destructive hover:text-destructive"
              >
                {revoke.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldOff className="size-4" />
                )}
                Revocar acceso
              </Button>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
