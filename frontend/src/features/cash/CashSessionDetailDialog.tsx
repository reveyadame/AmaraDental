import { Banknote, CreditCard as CardIcon, Landmark, Printer, ReceiptText } from 'lucide-react'
import { useCashSession } from './hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
import { Separator } from '@/shared/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn, formatMXN } from '@/shared/lib/utils'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/shared/types/cash'

const METHOD_LABEL: Record<PaymentMethod, string> = {
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

function MethodCard({
  icon: Icon,
  label,
  expected,
  counted,
  difference,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  expected: number | null
  counted: number | null
  difference: number | null
}) {
  const hasReconciliation = counted !== null && difference !== null
  const diffTone =
    !hasReconciliation
      ? 'text-muted-foreground'
      : (difference ?? 0) === 0
        ? 'text-muted-foreground'
        : (difference ?? 0) > 0
          ? 'text-emerald-600'
          : 'text-destructive'
  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Esperado</p>
          <p className="tabular-nums font-medium">
            {formatMXN(expected ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Contado</p>
          <p className="tabular-nums font-medium">
            {hasReconciliation ? formatMXN(counted ?? 0) : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Diferencia</p>
          <p className={cn('tabular-nums font-medium', diffTone)}>
            {hasReconciliation
              ? `${(difference ?? 0) >= 0 ? '+' : ''}${formatMXN(difference ?? 0)}`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

interface Props {
  sessionId: number | null
  onOpenChange: (open: boolean) => void
}

export function CashSessionDetailDialog({ sessionId, onOpenChange }: Props) {
  const query = useCashSession(sessionId ?? undefined)

  const openPrint = () => {
    if (!sessionId) return
    window.open(`/caja/cortes/${sessionId}/imprimir`, '_blank', 'noopener')
  }

  return (
    <Dialog open={!!sessionId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-5 text-primary" />
            Corte #{sessionId}
          </DialogTitle>
          <DialogDescription>
            {query.data ? (
              <>
                {query.data.user_name} ·{' '}
                {formatDateTime(query.data.opened_at)}
                {query.data.closed_at ? ` → ${formatDateTime(query.data.closed_at)}` : ''}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {query.isPending || !query.data ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={query.data.status === 'open' ? 'default' : 'secondary'}>
                {query.data.status === 'open' ? 'Abierta' : 'Cerrada'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Fondo de apertura: {formatMXN(query.data.opening_amount)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MethodCard
                icon={Banknote}
                label="Efectivo"
                expected={query.data.expected_cash}
                counted={query.data.closing_amount}
                difference={query.data.difference}
              />
              <MethodCard
                icon={CardIcon}
                label="Tarjeta"
                expected={query.data.card_expected ?? query.data.payments_summary?.by_method?.card ?? 0}
                counted={query.data.card_counted}
                difference={query.data.card_difference}
              />
              <MethodCard
                icon={Landmark}
                label="Transferencia"
                expected={query.data.transfer_expected ?? query.data.payments_summary?.by_method?.transfer ?? 0}
                counted={query.data.transfer_counted}
                difference={query.data.transfer_difference}
              />
            </div>

            {query.data.close_notes ? (
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Notas de cierre
                </p>
                <p className="text-sm whitespace-pre-wrap">{query.data.close_notes}</p>
              </div>
            ) : null}

            <Separator />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Pagos del turno{' '}
                {query.data.payments
                  ? `(${query.data.payments.length})`
                  : ''}
              </p>
              {query.data.payments && query.data.payments.length > 0 ? (
                <Table className="min-w-full text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Referencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {query.data.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell>{METHOD_LABEL[p.method]}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMXN(p.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.reference ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </div>

            {query.data.expenses && query.data.expenses.length > 0 ? (
              <>
                <Separator />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    Egresos del turno ({query.data.expenses.length}) —{' '}
                    <span className="text-destructive">
                      −{formatMXN(query.data.expenses_summary?.total ?? 0)}
                    </span>
                  </p>
                  <Table className="min-w-full text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.expenses.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-muted-foreground">
                            {e.paid_at
                              ? new Date(e.paid_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {EXPENSE_CATEGORY_LABELS[
                              e.category as ExpenseCategory
                            ] ?? e.category}
                          </TableCell>
                          <TableCell>{e.description}</TableCell>
                          <TableCell>{METHOD_LABEL[e.method]}</TableCell>
                          <TableCell className="text-right tabular-nums text-destructive">
                            −{formatMXN(e.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {query.data ? (
            <Button onClick={openPrint}>
              <Printer className="size-4" /> Imprimir / PDF
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
