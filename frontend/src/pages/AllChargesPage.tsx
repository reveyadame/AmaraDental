import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReceiptText, Search, Wallet } from 'lucide-react'
import { useCharges, useCurrentCashSession } from '@/features/cash/hooks'
import { ChargeDetailDialog } from '@/features/cash/ChargeDetailDialog'
import type { ChargeListQuery } from '@/features/cash/api'
import {
  CHARGE_STATUS_BADGE,
  type Charge,
  type ChargeStatus,
} from '@/shared/types/cash'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
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
import { accent } from '@/shared/lib/module-accents'

const PER_PAGE = 500

type Mode = 'session' | 'range'
type StatusFilter = 'all' | ChargeStatus

/** Fecha local (no UTC) en formato YYYY-MM-DD para los inputs. */
function todayLocal(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AllChargesPage() {
  const [mode, setMode] = useState<Mode>('session')
  const [dateFrom, setDateFrom] = useState(todayLocal())
  const [dateTo, setDateTo] = useState(todayLocal())
  const [status, setStatus] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 300)
  const [detailId, setDetailId] = useState<number | null>(null)

  const session = useCurrentCashSession()
  const noOpenSession = mode === 'session' && !session.isPending && !session.data

  const listQuery: ChargeListQuery = useMemo(() => {
    const q: ChargeListQuery = { per_page: PER_PAGE }
    if (mode === 'session') {
      q.current_session = true
    } else {
      if (dateFrom) q.date_from = dateFrom
      if (dateTo) q.date_to = dateTo
    }
    if (status !== 'all') q.status = status
    return q
  }, [mode, dateFrom, dateTo, status])

  const charges = useCharges(listQuery)

  const rows = useMemo(() => {
    const list = charges.data?.data ?? []
    if (!debounced.trim()) return list
    const t = debounced.toLowerCase()
    return list.filter(
      (c) =>
        c.patient_name?.toLowerCase().includes(t) ||
        c.code?.toLowerCase().includes(t),
    )
  }, [charges.data, debounced])

  const totals = useMemo(() => {
    let total = 0
    let paid = 0
    let balance = 0
    rows.forEach((c) => {
      total += c.total
      paid += c.paid_total
      balance += c.balance
    })
    return {
      total: +total.toFixed(2),
      paid: +paid.toFixed(2),
      balance: +balance.toFixed(2),
      count: rows.length,
    }
  }, [rows])

  // El endpoint regresó más cobros de los que cargamos en una página.
  const totalAvailable = charges.data?.meta.total ?? 0
  const truncated = totalAvailable > (charges.data?.data.length ?? 0)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('cash').badge}`}>
          <ReceiptText className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Todos los cobros
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos los cobros realizados, con o sin pagos registrados. Desde la apertura de la
            caja actual o dentro de un rango de fechas.
          </p>
        </div>
      </header>

      {/* Filtros */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Periodo</Label>
            <div className="inline-flex rounded-lg border p-0.5">
              <Button
                type="button"
                size="sm"
                variant={mode === 'session' ? 'default' : 'ghost'}
                className="h-8"
                onClick={() => setMode('session')}
              >
                Caja actual
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'range' ? 'default' : 'ghost'}
                className="h-8"
                onClick={() => setMode('range')}
              >
                Rango de fechas
              </Button>
            </div>
          </div>

          {mode === 'range' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="date_from" className="text-xs text-muted-foreground">
                  Desde
                </Label>
                <Input
                  id="date_from"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 w-[160px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_to" className="text-xs text-muted-foreground">
                  Hasta
                </Label>
                <Input
                  id="date_to"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 w-[160px]"
                />
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paciente o folio…"
                className="h-9 pl-9"
              />
            </div>
          </div>
        </div>

        {mode === 'session' && session.data?.opened_at ? (
          <p className="text-xs text-muted-foreground">
            Mostrando cobros desde la apertura de la caja —{' '}
            {formatDateTime(session.data.opened_at)}.
          </p>
        ) : null}
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobros</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totals.count.toLocaleString('es-MX')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Facturado</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatMXN(totals.total)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobrado</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatMXN(totals.paid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatMXN(totals.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {truncated ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Mostrando los primeros {PER_PAGE.toLocaleString('es-MX')} de{' '}
          {totalAvailable.toLocaleString('es-MX')} cobros. Acota el rango de fechas para ver
          totales exactos.
        </p>
      ) : null}

      {/* Tabla */}
      <Card>
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Wallet className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {noOpenSession
                      ? 'No hay una caja abierta. Abre una caja o consulta por rango de fechas.'
                      : debounced
                        ? `Sin resultados para "${debounced}"`
                        : 'No hay cobros en este periodo.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c: Charge) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailId(c.id)}
                >
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDateTime(c.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.code ?? `CHG-${c.id}`}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/pacientes/${c.patient_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {c.patient_name ?? '—'}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={CHARGE_STATUS_BADGE[c.status].className}>
                      {CHARGE_STATUS_BADGE[c.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMXN(c.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMXN(c.paid_total)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-semibold',
                      c.balance > 0 ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {formatMXN(c.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ChargeDetailDialog
        chargeId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  )
}
