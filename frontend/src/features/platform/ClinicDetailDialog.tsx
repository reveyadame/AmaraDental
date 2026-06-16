import { useState } from 'react'
import { toast } from 'sonner'
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  Trash2,
  TriangleAlert,
  User,
} from 'lucide-react'
import { useResetTenantAdminPassword, useTenantDetail } from './hooks'
import { BillingStateBadge, UsageBar } from './clinic-ui'
import { fmtDate } from './clinic-format'
import { useConfirm } from '@/shared/ui/confirm'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { BillingDetailsView } from '@/features/billing/BillingDetailsView'
import type { PlatformTenant } from './api'

const CENTRAL = import.meta.env.VITE_CENTRAL_DOMAIN as string | undefined

export function ClinicDetailDialog({
  tenantId,
  onOpenChange,
  onRequestDelete,
}: {
  tenantId: number | null
  onOpenChange: (open: boolean) => void
  onRequestDelete?: (tenant: PlatformTenant) => void
}) {
  const detail = useTenantDetail(tenantId)
  const reset = useResetTenantAdminPassword()
  const confirm = useConfirm()
  const t = detail.data

  const [resetResult, setResetResult] = useState<{ password: string; emailed: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  // Limpia el resultado al cambiar de clínica (ajuste de estado en render, el
  // patrón recomendado por React para resetear estado derivado de props).
  const [prevTenant, setPrevTenant] = useState(tenantId)
  if (tenantId !== prevTenant) {
    setPrevTenant(tenantId)
    setResetResult(null)
    setCopied(false)
  }

  const handleReset = async () => {
    if (!t) return
    const ok = await confirm({
      title: '¿Generar nueva contraseña?',
      description: `Se generará una contraseña nueva para ${t.contact?.admin_email ?? 'el admin'} y se le enviará por correo. La contraseña anterior dejará de funcionar.`,
      confirmText: 'Generar y enviar',
    })
    if (!ok) return
    reset.mutate(t.id, {
      onSuccess: (r) => {
        setResetResult({ password: r.admin_password, emailed: r.email_sent })
        setCopied(false)
        toast.success(
          r.email_sent
            ? 'Contraseña enviada por correo'
            : 'Contraseña generada (no se pudo enviar el correo)',
        )
      },
      onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible restablecer la contraseña')),
    })
  }

  const copyPassword = async () => {
    if (!resetResult) return
    try {
      await navigator.clipboard.writeText(resetResult.password)
      setCopied(true)
      toast.success('Contraseña copiada')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <Dialog open={tenantId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t?.name ?? 'Clínica'}
            {t?.billing_lite ? <BillingStateBadge state={t.billing_lite.state} /> : null}
          </DialogTitle>
          <DialogDescription>
            {t ? (
              <span className="flex items-center gap-2">
                <span className="font-mono">{t.slug}</span> · {t.plan?.name ?? 'sin plan'}
                {CENTRAL ? (
                  <a
                    href={`https://${t.slug}.${CENTRAL}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    abrir <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </span>
            ) : (
              'Cargando…'
            )}
          </DialogDescription>
        </DialogHeader>

        {detail.isPending ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !t ? (
          <p className="text-sm text-muted-foreground">No se pudo cargar el detalle.</p>
        ) : (
          <div className="space-y-4">
            {/* Uso y conteos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pacientes</p>
                <div className="mt-1">
                  <UsageBar usage={t.usage} />
                </div>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Usuarios</p>
                <p className="text-lg font-semibold">{t.counts?.users ?? '—'}</p>
              </div>
            </div>

            {/* Contacto */}
            {t.contact ? (
              <div className="space-y-1.5 rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground">Contacto del administrador</p>
                <p className="flex items-center gap-2 text-sm">
                  <User className="size-3.5 text-muted-foreground" />
                  {t.contact.admin_name ?? '—'}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {t.contact.admin_email ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Último acceso: {fmtDate(t.contact.last_login_at)}
                </p>

                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReset}
                    disabled={reset.isPending}
                  >
                    {reset.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    Restablecer contraseña
                  </Button>
                </div>

                {resetResult ? (
                  <div className="mt-2 space-y-2 rounded-md border bg-muted/40 p-3">
                    <p
                      className={
                        resetResult.emailed
                          ? 'flex items-center gap-1.5 text-xs text-emerald-600'
                          : 'flex items-center gap-1.5 text-xs text-amber-600'
                      }
                    >
                      {resetResult.emailed ? (
                        <>
                          <MailCheck className="size-3.5" /> Enviada por correo a {t.contact.admin_email}
                        </>
                      ) : (
                        <>
                          <TriangleAlert className="size-3.5" /> No se pudo enviar el correo. Comparte la
                          contraseña manualmente.
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-background px-2 py-1.5 font-mono text-sm">
                        {resetResult.password}
                      </code>
                      <Button size="icon" variant="ghost" className="size-8" onClick={copyPassword}>
                        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Esta contraseña no se vuelve a mostrar. La anterior ya no funciona.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Suscripción */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Suscripción</p>
              {t.billing ? (
                <BillingDetailsView renewsAt={t.billing.renews_at} invoices={t.billing.invoices} />
              ) : null}
              {t.billing && !t.billing.renews_at && t.billing.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.billing.on_trial && t.billing.trial_ends_at
                    ? `En prueba hasta el ${fmtDate(t.billing.trial_ends_at)}.`
                    : 'Sin facturas todavía.'}
                </p>
              ) : null}
            </div>

            {/* Alta + borrado */}
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">Alta: {fmtDate(t.created_at)}</p>
              {onRequestDelete ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRequestDelete(t)}
                >
                  <Trash2 className="size-4" /> Eliminar clínica
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
