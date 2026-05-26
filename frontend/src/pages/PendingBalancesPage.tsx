import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HandCoins, Search, Wallet } from 'lucide-react'
import { useCharges } from '@/features/cash/hooks'
import { ChargeDetailDialog } from '@/features/cash/ChargeDetailDialog'
import type { Charge } from '@/shared/types/cash'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Skeleton } from '@/shared/ui/skeleton'
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

function daysSince(iso: string | null): number {
  if (!iso) return 0
  const diffMs = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(diffMs / 86_400_000))
}

function agingBucket(days: number): { label: string; tone: string } {
  if (days <= 7) return { label: '0–7 días', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  if (days <= 30) return { label: '8–30 días', tone: 'bg-amber-100 text-amber-800 border-amber-200' }
  if (days <= 60) return { label: '31–60 días', tone: 'bg-orange-100 text-orange-800 border-orange-200' }
  return { label: '> 60 días', tone: 'bg-rose-100 text-rose-800 border-rose-200' }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function PendingBalancesPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 300)
  const charges = useCharges({
    has_balance: true,
    oldest_first: true,
    per_page: 500,
  })
  const [detailId, setDetailId] = useState<number | null>(null)

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
    const patients = new Set<number>()
    rows.forEach((c) => {
      total += c.total
      paid += c.paid_total
      balance += c.balance
      patients.add(c.patient_id)
    })
    return {
      total: +total.toFixed(2),
      paid: +paid.toFixed(2),
      balance: +balance.toFixed(2),
      patients: patients.size,
      count: rows.length,
    }
  }, [rows])

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('cash').badge}`}>
          <HandCoins className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Saldos por cobrar
          </h1>
          <p className="text-sm text-muted-foreground">
            Cobros con saldo pendiente (pendientes y parciales). Ordenados del más antiguo al
            más reciente para priorizar seguimiento.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Saldo total
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatMXN(totals.balance)}
            </p>
          </CardContent>
        </Card>
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pacientes</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {totals.patients.toLocaleString('es-MX')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Pagado a cuenta
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatMXN(totals.paid)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              de {formatMXN(totals.total)} facturado
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por paciente o folio…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Antigüedad</TableHead>
              <TableHead>Folio</TableHead>
              <TableHead>Paciente</TableHead>
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
                    {debounced ? `Sin resultados para "${debounced}"` : 'No hay saldos pendientes.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c: Charge) => {
                const days = daysSince(c.created_at)
                const bucket = agingBucket(days)
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetailId(c.id)}
                  >
                    <TableCell className="text-sm">
                      <p>{formatDate(c.created_at)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        hace {days} {days === 1 ? 'día' : 'días'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-normal', bucket.tone)}>
                        {bucket.label}
                      </Badge>
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
                        {c.patient_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMXN(c.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMXN(c.paid_total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatMXN(c.balance)}
                    </TableCell>
                  </TableRow>
                )
              })
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
