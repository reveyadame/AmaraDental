import { toast } from 'sonner'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { useAuth } from '@/shared/auth/permissions'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { useBilling, useBillingDetails, useCheckout, usePortal } from './hooks'
import { PaymentsDialog } from './PaymentsDialog'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

export function BillingCard() {
  const { isAdmin } = useAuth()
  const billing = useBilling()
  const details = useBillingDetails(isAdmin)
  const checkout = useCheckout()
  const portal = usePortal()

  if (billing.isPending) {
    return (
      <Card>
        <CardContent className="grid place-items-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }
  if (!billing.data) return null
  const b = billing.data

  const onError = (e: unknown) => toast.error(getApiErrorMessage(e, 'No fue posible abrir el pago'))
  const redirect = (url: string) => {
    window.location.href = url
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4" /> Suscripción y pago
          </CardTitle>
          {b.subscribed ? (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              Suscripción activa
            </Badge>
          ) : b.on_trial ? (
            <Badge variant="outline">Prueba</Badge>
          ) : b.has_active_billing ? (
            <Badge variant="secondary">Activa</Badge>
          ) : (
            <Badge variant="destructive">Sin pago</Badge>
          )}
        </div>
        <CardDescription>
          {b.subscribed
            ? `${b.card_last_four ? `Tarjeta •••• ${b.card_last_four}. ` : 'Suscripción activa. '}${
                b.on_grace_period && b.ends_at ? `Se cancela el ${fmtDate(b.ends_at)}.` : ''
              }`
            : b.on_trial && b.trial_ends_at
              ? `Estás en periodo de prueba hasta el ${fmtDate(
                  b.trial_ends_at,
                )}. Agrega un método de pago para continuar después.`
              : b.has_active_billing
                ? 'Tu clínica tiene acceso activo.'
                : 'Tu prueba terminó. Agrega un método de pago para reactivar el sistema.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && details.data ? (
          <div className="space-y-3">
            {details.data.renews_at ? (
              <p className="text-sm text-muted-foreground">
                Renueva el{' '}
                <span className="font-medium text-foreground">
                  {fmtDate(details.data.renews_at)}
                </span>
                .
              </p>
            ) : null}
            {details.data.invoices.length > 0 ? (
              <PaymentsDialog invoices={details.data.invoices} />
            ) : null}
          </div>
        ) : null}
        {!isAdmin ? (
          <p className="text-sm text-muted-foreground">
            Solo un administrador puede gestionar el pago.
          </p>
        ) : b.subscribed ? (
          <Button
            variant="outline"
            onClick={() => portal.mutate(undefined, { onSuccess: redirect, onError })}
            disabled={portal.isPending}
          >
            {portal.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ExternalLink className="size-4" />
            )}
            Administrar pago
          </Button>
        ) : (
          <Button
            onClick={() => checkout.mutate(undefined, { onSuccess: redirect, onError })}
            disabled={checkout.isPending}
          >
            {checkout.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            {b.on_trial
              ? 'Agregar método de pago'
              : b.has_active_billing
                ? 'Iniciar suscripción'
                : 'Reactivar suscripción'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
