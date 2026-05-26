import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

interface Props {
  error: unknown
  onRetry?: () => void
}

export function ReportError({ error, onRetry }: Props) {
  const status =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { status?: number } }).response?.status
      : undefined
  const message =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
      : null
  const fallback = error instanceof Error ? error.message : 'Error desconocido'

  return (
    <Card className="border-destructive/40">
      <CardContent className="p-5 flex items-start gap-3">
        <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            No fue posible cargar el reporte
            {status ? ` (HTTP ${status})` : ''}
          </p>
          <p className="text-xs text-muted-foreground break-words">
            {message ?? fallback}
          </p>
          {status === 403 ? (
            <p className="text-xs text-muted-foreground">
              Solo los administradores pueden ver reportes.
            </p>
          ) : null}
        </div>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" /> Reintentar
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
