import { useState } from 'react'
import { Plus, Trash2, TrendingDown } from 'lucide-react'
import { useCurrentCashSession } from './hooks'
import { DeleteMovementDialog } from './DeleteMovementDialog'
import { NewCashExpenseDialog } from './NewCashExpenseDialog'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/shared/types/cash'
import { useMe } from '@/features/auth/hooks'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { cn, formatMXN } from '@/shared/lib/utils'

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CashExpensesSection() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const canOperate = me?.permissions.includes('cash.operate') ?? false
  const session = useCurrentCashSession()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    label: string
  } | null>(null)

  if (session.isPending) {
    return <Skeleton className="h-40 w-full" />
  }
  if (!session.data) return null

  const expenses = session.data.expenses ?? []
  const total = session.data.expenses_summary?.total ?? 0


  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-md bg-destructive/10 text-destructive">
            <TrendingDown className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Egresos del turno
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {expenses.length} {expenses.length === 1 ? 'movimiento' : 'movimientos'}
              {' · '}
              <span className="text-destructive font-medium">
                −{formatMXN(total)}
              </span>
            </p>
          </div>
        </div>
        {canOperate ? (
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Registrar egreso
          </Button>
        ) : null}
      </div>

      {expenses.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No hay egresos registrados en este turno.
        </p>
      ) : (
        <div className="rounded-md border divide-y">
          {expenses.map((e) => (
            <div
              key={e.id}
              className={cn(
                'px-3 py-2 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center text-sm',
              )}
            >
              <div className="sm:col-span-5">
                <p className="font-medium truncate">{e.description}</p>
                <p className="text-xs text-muted-foreground">
                  {EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ??
                    e.category}
                  {e.reference ? ` · Ref. ${e.reference}` : ''}
                </p>
              </div>
              <div className="sm:col-span-3 text-xs text-muted-foreground">
                {METHOD_LABEL[e.method] ?? e.method}
                <span className="text-muted-foreground/70">
                  {' · '}
                  {formatTime(e.paid_at)}
                </span>
              </div>
              <div className="sm:col-span-3 text-right tabular-nums font-medium text-destructive">
                −{formatMXN(e.amount)}
              </div>
              <div className="sm:col-span-1 flex sm:justify-end">
                {isAdmin ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() =>
                      setDeleteTarget({
                        id: e.id,
                        label: `Egreso "${e.description}" · ${formatMXN(e.amount)}`,
                      })
                    }
                    aria-label={`Eliminar egreso "${e.description}"`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewCashExpenseDialog open={open} onOpenChange={setOpen} />

      {deleteTarget ? (
        <DeleteMovementDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          kind="expense"
          movementId={deleteTarget.id}
          label={deleteTarget.label}
        />
      ) : null}
    </Card>
  )
}
