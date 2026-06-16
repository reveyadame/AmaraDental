import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import type { BillingState, TenantUsage } from './api'

const BILLING: Record<BillingState, { label: string; className: string }> = {
  active: { label: 'Al corriente', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  trial: { label: 'En prueba', className: 'bg-sky-100 text-sky-700 border-sky-200' },
  past_due: { label: 'Morosa', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  canceled: { label: 'Cancelada', className: 'bg-rose-100 text-rose-700 border-rose-200' },
  none: { label: 'Sin pago', className: 'bg-muted text-muted-foreground' },
}

export function BillingStateBadge({ state }: { state: BillingState }) {
  const s = BILLING[state]
  return (
    <Badge variant="outline" className={cn('font-medium', s.className)}>
      {s.label}
    </Badge>
  )
}

export function UsageBar({ usage }: { usage: TenantUsage | undefined }) {
  if (!usage) return <span className="text-sm text-muted-foreground">—</span>

  if (usage.max_patients === null) {
    return (
      <div className="text-sm">
        <span className="font-medium">{usage.patients.toLocaleString('es-MX')}</span>
        <span className="text-muted-foreground"> · ilimitado</span>
      </div>
    )
  }

  const percent = usage.percent ?? 0
  const barColor =
    percent >= 90 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-primary'

  return (
    <div className="w-32 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          {usage.patients}/{usage.max_patients}
        </span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
