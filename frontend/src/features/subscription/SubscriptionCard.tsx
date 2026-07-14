import { Loader2, Users } from 'lucide-react'
import { useSubscription } from './hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

/**
 * Resumen de la suscripción de la clínica: plan y uso de pacientes. El cambio
 * de plan es manual (contactar a Amara Dental) hasta que exista el billing
 * automático.
 */
export function SubscriptionCard() {
  const sub = useSubscription()

  if (sub.isPending) {
    return (
      <Card>
        <CardContent className="grid place-items-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!sub.data) return null

  const { plan, max_patients, patients_count } = sub.data
  const unlimited = max_patients === null
  const pct = unlimited ? 0 : Math.min(100, Math.round((patients_count / max_patients) * 100))
  const atLimit = !unlimited && patients_count >= max_patients
  const near = !unlimited && pct >= 90 && !atLimit

  const barColor = atLimit ? 'bg-destructive' : near ? 'bg-amber-500' : 'bg-primary'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{plan ? `Plan ${plan}` : 'Sin plan asignado'}</CardTitle>
        <CardDescription>Tu suscripción a Amara Dental.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" /> Pacientes
            </span>
            <span className="font-medium">
              {unlimited ? `${patients_count} · ilimitado` : `${patients_count} / ${max_patients}`}
            </span>
          </div>
          {!unlimited ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
          ) : null}
        </div>

        {atLimit ? (
          <p className="text-sm text-destructive">
            Llegaste al límite de pacientes de tu plan. Contacta a Amara Dental para subir de plan.
          </p>
        ) : near ? (
          <p className="text-sm text-amber-600 dark:text-amber-500">
            Estás cerca del límite de tu plan ({patients_count}/{max_patients}).
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Para cambiar de plan, contacta a Amara Dental.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
