import { Loader2 } from 'lucide-react'
import { useTenantDetail } from './hooks'
import { Badge } from '@/shared/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { BillingDetailsView } from '@/features/billing/BillingDetailsView'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

export function ClinicDetailDialog({
  tenantId,
  onOpenChange,
}: {
  tenantId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const detail = useTenantDetail(tenantId)
  const t = detail.data

  return (
    <Dialog open={tenantId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t?.name ?? 'Clínica'}</DialogTitle>
          <DialogDescription>
            {t ? `${t.slug} · ${t.plan?.name ?? 'sin plan'}` : 'Cargando…'}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Usuarios</p>
                <p className="text-lg font-semibold">{t.counts?.users ?? '—'}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pacientes</p>
                <p className="text-lg font-semibold">{t.counts?.patients ?? '—'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Suscripción</span>
                {t.billing?.subscribed ? (
                  <Badge variant="secondary">Activa</Badge>
                ) : t.billing?.on_trial ? (
                  <Badge variant="outline">Prueba</Badge>
                ) : (
                  <Badge variant="destructive">Sin pago</Badge>
                )}
              </div>

              {t.billing ? (
                <BillingDetailsView
                  renewsAt={t.billing.renews_at}
                  invoices={t.billing.invoices}
                />
              ) : null}

              {t.billing && !t.billing.renews_at && t.billing.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t.billing.on_trial && t.billing.trial_ends_at
                    ? `En prueba hasta el ${fmtDate(t.billing.trial_ends_at)}.`
                    : 'Sin facturas todavía.'}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
