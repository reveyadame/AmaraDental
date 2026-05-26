import type { ReactNode } from 'react'
import { Card, CardContent } from '@/shared/ui/card'
import { cn } from '@/shared/lib/utils'

interface Props {
  label: string
  value: ReactNode
  hint?: ReactNode
  className?: string
}

export function Kpi({ label, value, hint, className }: Props) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
