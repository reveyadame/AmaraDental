import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from 'lucide-react'
import { CashSessionCard } from '@/features/cash/CashSessionCard'
import { CashExpensesSection } from '@/features/cash/CashExpensesSection'
import { ChargeDetailDialog } from '@/features/cash/ChargeDetailDialog'
import { DeleteMovementDialog } from '@/features/cash/DeleteMovementDialog'
import {
  useCashSessionMovements,
  useCurrentCashSession,
} from '@/features/cash/hooks'
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/shared/types/cash'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn, formatMXN } from '@/shared/lib/utils'
import { useMe } from '@/features/auth/hooks'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta de débito',
  card_credit: 'Tarjeta de crédito',
  transfer: 'Transferencia',
  credit: 'Saldo a favor',
}

// La caja puede durar abierta varios días → mostramos la fecha del movimiento.
function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

export function CashPage() {
  const { data: me } = useMe()
  const canOperate = me?.permissions.includes('cash.operate') ?? false
  const session = useCurrentCashSession()
  const isAdmin = me?.roles.includes('admin') ?? false
  const [detailId, setDetailId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'payment' | 'expense'
    id: number
    label: string
  } | null>(null)

  const [typeFilter, setTypeFilter] = useState<'all' | 'payment' | 'expense'>('all')
  const [perPage, setPerPage] = useState(25)
  const [page, setPage] = useState(1)

  // Resetea la página al cambiar filtros.
  useEffect(() => {
    setPage(1)
  }, [typeFilter, perPage, session.data?.id])

  const movements = useCashSessionMovements(session.data?.id, {
    type: typeFilter,
    page,
    per_page: perPage,
  })
  const lastPage = movements.data?.meta.last_page ?? 1
  const total = movements.data?.meta.total ?? 0
  const sums = movements.data?.meta.sums

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Caja</h1>
          <p className="text-sm text-muted-foreground">
            Cobros, parcialidades y corte de caja.
          </p>
        </div>
        {session.data && canOperate ? (
          <Button asChild>
            <Link to="/caja/nuevo">
              <Plus className="size-4" /> Nuevo cobro
            </Link>
          </Button>
        ) : null}
      </header>

      <CashSessionCard />

      {!session.data && canOperate ? (
        <p className="text-xs text-muted-foreground text-center">
          Para registrar cobros primero abre tu sesión de caja.
        </p>
      ) : null}

      <CashExpensesSection />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Movimientos recientes
            </h2>
            <p className="text-xs text-muted-foreground">
              {session.data
                ? 'Pagos y egresos desde la apertura de la caja'
                : 'Abre tu caja para ver los movimientos'}
            </p>
          </div>
          {session.data && sums ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <ArrowDownLeft className="size-3.5" /> Entradas{' '}
                <span className="font-semibold tabular-nums">
                  {formatMXN(sums.in)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                <ArrowUpRight className="size-3.5" /> Salidas{' '}
                <span className="font-semibold tabular-nums">
                  {formatMXN(sums.out)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Wallet className="size-3.5" /> Neto{' '}
                <span className="font-semibold tabular-nums">
                  {formatMXN(sums.net)}
                </span>
              </span>
            </div>
          ) : null}
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as 'all' | 'payment' | 'expense')}
            disabled={!session.data}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los movimientos</SelectItem>
              <SelectItem value="payment">Solo entradas (pagos)</SelectItem>
              <SelectItem value="expense">Solo salidas (egresos)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                {isAdmin ? <TableHead className="text-right w-12"></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!session.data ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="py-14 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                      <Wallet className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sin caja abierta. Abre tu sesión para empezar a registrar
                      movimientos.
                    </p>
                  </TableCell>
                </TableRow>
              ) : movements.isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 7 : 6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (movements.data?.data.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="py-14 text-center">
                    <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                      <ReceiptText className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aún no hay movimientos en esta caja.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                movements.data!.data.map((m) => {
                  const isIn = m.type === 'payment'
                  return (
                    <TableRow
                      key={`${m.type}-${m.id}`}
                      className={cn(
                        m.charge_id && 'cursor-pointer hover:bg-muted/40',
                      )}
                      onClick={() => {
                        if (m.charge_id) setDetailId(m.charge_id)
                      }}
                    >
                      <TableCell className="text-xs whitespace-nowrap font-mono">
                        {formatDate(m.occurred_at)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                            isIn
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border-rose-200',
                          )}
                        >
                          {isIn ? (
                            <ArrowDownLeft className="size-3" />
                          ) : (
                            <ArrowUpRight className="size-3" />
                          )}
                          {isIn ? 'Entrada' : 'Salida'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isIn ? (
                          <>
                            <p className="text-sm font-medium">
                              {m.patient_name ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {m.charge_code ?? (m.charge_id ? `CHG-${m.charge_id}` : '')}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">
                              {m.description ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {m.category
                                ? (EXPENSE_CATEGORY_LABELS[
                                    m.category as ExpenseCategory
                                  ] ?? m.category)
                                : null}
                            </p>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {METHOD_LABEL[m.method] ?? m.method}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {m.reference ?? '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums font-semibold whitespace-nowrap',
                          isIn ? 'text-emerald-700' : 'text-rose-700',
                        )}
                      >
                        {isIn ? '+' : '−'}
                        {formatMXN(m.amount)}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive size-8 p-0"
                            onClick={() => {
                              const label = isIn
                                ? `Pago de ${m.patient_name ?? 'paciente'} · ${formatMXN(m.amount)} (${METHOD_LABEL[m.method] ?? m.method})`
                                : `Egreso "${m.description ?? ''}" · ${formatMXN(m.amount)}`
                              setDeleteTarget({
                                kind: m.type,
                                id: m.id,
                                label,
                              })
                            }}
                            aria-label={`Eliminar ${isIn ? 'pago' : 'egreso'}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {session.data && total > 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground border-t flex items-center justify-between gap-3 flex-wrap">
              <span className="tabular-nums">
                Mostrando {(page - 1) * perPage + 1}–
                {(page - 1) * perPage + (movements.data?.data.length ?? 0)} de{' '}
                {total} movimientos
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs">Por página</Label>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => setPerPage(Number(v))}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    aria-label="Primera página"
                  >
                    <ChevronsLeft className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <span className="px-2 tabular-nums">
                    {page} / {lastPage}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8"
                    onClick={() => setPage(lastPage)}
                    disabled={page >= lastPage}
                    aria-label="Última página"
                  >
                    <ChevronsRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </section>

      <ChargeDetailDialog
        chargeId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />

      {deleteTarget ? (
        <DeleteMovementDialog
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          kind={deleteTarget.kind}
          movementId={deleteTarget.id}
          label={deleteTarget.label}
        />
      ) : null}
    </div>
  )
}
