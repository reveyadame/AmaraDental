import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Ban, CreditCard, Loader2, Printer, ReceiptText } from 'lucide-react'
import { useCancelCharge, useCharge } from './hooks'
import { openChargeTicket } from './openChargeTicket'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { CHARGE_STATUS_BADGE, type PaymentMethod } from '@/shared/types/cash'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { formatMXN } from '@/shared/lib/utils'


const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta de débito',
  card_credit: 'Tarjeta de crédito',
  transfer: 'Transferencia',
  credit: 'Saldo a favor',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

interface Props {
  chargeId: number | null
  onOpenChange: (open: boolean) => void
}

export function ChargeDetailDialog({ chargeId, onOpenChange }: Props) {
  const { data: me } = useMe()
  const canCancel = me?.permissions.includes('charges.cancel') ?? false
  const query = useCharge(chargeId ?? undefined)
  const cancel = useCancelCharge(chargeId ?? 0)
  const confirm = useConfirm()

  const onCancel = async () => {
    const ok = await confirm({
      title: '¿Cancelar este cobro?',
      description: 'Los pagos registrados quedarán en su sesión.',
      confirmText: 'Cancelar cobro',
      cancelText: 'Volver',
      variant: 'destructive',
    })
    if (!ok) return
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('Cobro cancelado'),
      onError: () => toast.error('No fue posible cancelar'),
    })
  }

  return (
    <Dialog open={!!chargeId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-primary" />
            Cobro {query.data?.code ?? ''}
          </DialogTitle>
          <DialogDescription>
            {query.data?.patient_name} · {formatDateTime(query.data?.created_at ?? null)}
          </DialogDescription>
        </DialogHeader>

        {query.isPending || !query.data ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge className={CHARGE_STATUS_BADGE[query.data.status].className}>
                {CHARGE_STATUS_BADGE[query.data.status].label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Creado por {query.data.created_by_name ?? '—'}
              </p>
            </div>

            <section>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Tratamientos
              </p>
              <div className="space-y-2">
                {query.data.items?.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {it.treatment_name}
                        {it.quantity > 1 ? (
                          <span className="text-muted-foreground"> × {it.quantity}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {it.specialist_name ?? 'Sin especialista'}
                        {it.commission_percent !== null ? (
                          <>
                            {' '}
                            · Comisión {it.commission_percent}%{' '}
                            <span className="text-muted-foreground/70">
                              ({formatMXN(it.commission_amount)})
                            </span>
                          </>
                        ) : null}
                        {it.discount_amount > 0 ? (
                          <> · Descuento {formatMXN(it.discount_amount)}</>
                        ) : null}
                      </p>
                    </div>
                    <p className="tabular-nums text-sm font-medium">
                      {formatMXN(it.line_total)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border p-4 text-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMXN(query.data.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Descuentos</span>
                <span className="tabular-nums">- {formatMXN(query.data.discount_total)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMXN(query.data.total)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Pagado</span>
                <span className="tabular-nums">{formatMXN(query.data.paid_total)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Saldo</span>
                <span
                  className={
                    'tabular-nums ' +
                    (query.data.balance <= 0 ? 'text-emerald-600' : 'text-foreground')
                  }
                >
                  {formatMXN(query.data.balance)}
                </span>
              </div>
            </section>

            <section>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Pagos
              </p>
              {query.data.payments && query.data.payments.length > 0 ? (
                <ul className="divide-y rounded-md border">
                  {query.data.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 p-3 text-sm"
                    >
                      <div>
                        <p className="text-foreground">
                          {methodLabel[p.method]}
                          {p.reference ? (
                            <span className="text-muted-foreground"> · {p.reference}</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(p.paid_at)} · {p.user_name ?? '—'}
                        </p>
                      </div>
                      <p className="tabular-nums font-medium">{formatMXN(p.amount)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground rounded-md border border-dashed p-3 text-center">
                  Sin pagos todavía.
                </p>
              )}
            </section>

            {query.data.notes ? (
              <section className="rounded-md bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Notas
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {query.data.notes}
                </p>
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {canCancel &&
            query.data?.status !== 'cancelled' &&
            (query.data?.paid_total ?? 0) === 0 ? (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={onCancel}
                disabled={cancel.isPending}
              >
                <Ban className="size-4" /> Cancelar cobro
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {query.data && query.data.status !== 'cancelled' ? (
              <Button
                variant="outline"
                onClick={() => openChargeTicket(query.data!.id)}
              >
                <Printer className="size-4" /> Imprimir ticket
              </Button>
            ) : null}
            {query.data &&
            query.data.balance > 0 &&
            query.data.status !== 'cancelled' ? (
              <Button asChild>
                <Link to={`/caja/cobros/${query.data.id}/pagar`}>
                  <CreditCard className="size-4" /> Registrar pago
                </Link>
              </Button>
            ) : null}
          </div>
        </DialogFooter>

        {cancel.isPending ? (
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" /> Cancelando…
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
