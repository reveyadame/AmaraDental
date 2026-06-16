import { Link } from 'react-router-dom'
import { AlertTriangle, CreditCard } from 'lucide-react'
import { useBilling } from './hooks'

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

/**
 * Banner global de billing: bloqueante (rojo) si la suscripción no está activa,
 * o aviso (ámbar) si la prueba está por terminar. Lleva a Configuración a pagar.
 */
export function BillingBanner() {
  const billing = useBilling()
  const b = billing.data
  if (!b) return null

  const blocked = !b.has_active_billing
  const trialEndingSoon =
    b.on_trial &&
    b.trial_ends_at !== null &&
    new Date(b.trial_ends_at).getTime() - Date.now() < THREE_DAYS_MS

  if (!blocked && !trialEndingSoon) return null

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm text-white sm:px-6 ${
        blocked ? 'bg-destructive' : 'bg-amber-500'
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {blocked ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <CreditCard className="size-4 shrink-0" />
        )}
        {blocked
          ? 'Tu suscripción no está activa. Regulariza tu pago para seguir usando el sistema.'
          : 'Tu periodo de prueba está por terminar. Agrega un método de pago.'}
      </span>
      <Link to="/configuracion" className="whitespace-nowrap font-medium underline">
        Ir a pagar →
      </Link>
    </div>
  )
}
