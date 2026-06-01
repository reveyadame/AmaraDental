import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useCashMovements } from '@/features/cash/hooks'
import { DeleteMovementDialog } from '@/features/cash/DeleteMovementDialog'
import { useAuth } from '@/shared/auth/permissions'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
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
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { cn, formatMXN } from '@/shared/lib/utils'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '@/shared/types/cash'
import { accent } from '@/shared/lib/module-accents'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarj. débito',
  card_credit: 'Tarj. crédito',
  transfer: 'Transferencia',
  credit: 'Saldo a favor',
}

const METHOD_BADGE: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  card: 'bg-sky-100 text-sky-900 border-sky-200',
  card_credit: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  transfer: 'bg-violet-100 text-violet-900 border-violet-200',
  credit: 'bg-lime-100 text-lime-900 border-lime-200',
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

type MovementType = 'all' | 'payment' | 'expense'
type MethodFilter = 'all' | 'cash' | 'card' | 'card_credit' | 'transfer' | 'credit'

const PER_PAGE = 25

export function CashMovementsPage() {
  const { can, isAdmin } = useAuth()

  const [dateFrom, setDateFrom] = useState<string>(firstOfMonthISO())
  const [dateTo, setDateTo] = useState<string>(todayISO())
  const [type, setType] = useState<MovementType>('all')
  const [method, setMethod] = useState<MethodFilter>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const debouncedQ = useDebouncedValue(q, 350)

  const filters = {
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    type: type === 'all' ? undefined : type,
    method: method === 'all' ? undefined : method,
    q: debouncedQ || undefined,
    page,
    per_page: PER_PAGE,
  }
  const movements = useCashMovements(filters)

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'payment' | 'expense'
    id: number
    label: string
  } | null>(null)

  // Disponible para el rol Caja (cash.operate); eliminar es solo admin.
  const canView = can('cash.operate')
  const canDelete = isAdmin
  if (!canView) return <Navigate to="/" replace />

  const data = movements.data?.data ?? []
  const meta = movements.data?.meta
  const sums = meta?.sums
  // Columnas visibles: la de acciones solo aplica si el usuario puede eliminar.
  const colCount = canDelete ? 7 : 6

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('cash').badge}`}>
          <Wallet className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Movimientos de caja
          </h1>
          <p className="text-sm text-muted-foreground">
            Vista consolidada de entradas y salidas por rango de fechas. Útil para
            auditar y revertir errores.
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="date_from">Desde</Label>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_to">Hasta</Label>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v as MovementType)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="payment">Entradas (cobros)</SelectItem>
                  <SelectItem value="expense">Salidas (egresos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Método</Label>
              <Select
                value={method}
                onValueChange={(v) => {
                  setMethod(v as MethodFilter)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta de débito</SelectItem>
                  <SelectItem value="card_credit">Tarjeta de crédito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="credit">Saldo a favor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Paciente, cobro, concepto…"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {sums ? (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Entradas
                </p>
                <p className="text-lg font-semibold tabular-nums text-emerald-700">
                  {formatMXN(sums.in)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Salidas
                </p>
                <p className="text-lg font-semibold tabular-nums text-rose-700">
                  {formatMXN(sums.out)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Neto
                </p>
                <p
                  className={cn(
                    'text-lg font-semibold tabular-nums',
                    sums.net >= 0 ? 'text-foreground' : 'text-rose-700',
                  )}
                >
                  {formatMXN(sums.net)}
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Concepto / Paciente</TableHead>
              <TableHead>Registrado por</TableHead>
              {canDelete ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.isPending ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-14 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sin movimientos en este rango.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              data.map((m) => (
                <TableRow key={`${m.type}-${m.id}`}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatDateTime(m.occurred_at)}
                  </TableCell>
                  <TableCell>
                    {m.type === 'payment' ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                        <ArrowDownCircle className="size-3 mr-1" />
                        Entrada
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-900 border border-rose-200 hover:bg-rose-100">
                        <ArrowUpCircle className="size-3 mr-1" />
                        Salida
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('font-normal', METHOD_BADGE[m.method as string])}
                    >
                      {METHOD_LABEL[m.method as string] ?? m.method}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-medium',
                      m.type === 'payment' ? 'text-emerald-700' : 'text-rose-700',
                    )}
                  >
                    {m.type === 'payment' ? '+' : '−'}
                    {formatMXN(m.amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {m.type === 'payment' ? (
                      <div>
                        <p className="font-medium">{m.patient_name ?? '—'}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {m.charge_code ?? `CHG-${m.charge_id}`}
                          {m.charge_status === 'cancelled' ? (
                            <span className="ml-1 text-rose-700">(cancelado)</span>
                          ) : null}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{m.description ?? '—'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.category
                            ? EXPENSE_CATEGORY_LABELS[m.category as ExpenseCategory] ??
                              m.category
                            : '—'}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {m.registered_by_name ?? m.user_name ?? '—'}
                    {m.cash_session_status === 'closed' ? (
                      <p className="text-[10px] text-rose-700">corte cerrado</p>
                    ) : null}
                  </TableCell>
                  {canDelete ? (
                    <TableCell className="text-right">
                      {m.cash_session_status === 'open' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            setDeleteTarget({
                              kind: m.type,
                              id: m.id,
                              label:
                                m.type === 'payment'
                                  ? `${m.charge_code ?? `CHG-${m.charge_id}`} — ${formatMXN(m.amount)}`
                                  : `${m.description ?? 'Egreso'} — ${formatMXN(m.amount)}`,
                            })
                          }
                          aria-label="Eliminar movimiento"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : (
                        <span
                          className="text-[10px] uppercase tracking-wide text-muted-foreground"
                          title="No se puede eliminar: el corte de caja ya está cerrado."
                        >
                          Corte cerrado
                        </span>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.total > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium text-foreground">
              {(meta.current_page - 1) * meta.per_page + 1}–
              {Math.min(meta.current_page * meta.per_page, meta.total)}
            </span>{' '}
            de <span className="font-medium text-foreground">{meta.total}</span> movimientos
          </p>
          {meta.last_page > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Página {meta.current_page} de {meta.last_page}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {deleteTarget ? (
        <DeleteMovementDialog
          open={true}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null)
          }}
          kind={deleteTarget.kind}
          movementId={deleteTarget.id}
          label={deleteTarget.label}
        />
      ) : null}
    </div>
  )
}
