import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FileText, Plus, Search } from 'lucide-react'
import { useQuotes } from '@/features/quotes/hooks'
import { useAuth } from '@/shared/auth/permissions'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
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
import { accent } from '@/shared/lib/module-accents'
import { formatMXN } from '@/shared/lib/utils'
import { QUOTE_STATUS_BADGE, type QuoteStatus } from '@/shared/types/quote'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const STATUS_OPTIONS: Array<{ value: 'all' | QuoteStatus; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'sent', label: 'Enviada' },
  { value: 'accepted', label: 'Aceptada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'converted', label: 'Convertida' },
]

export function QuotesPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const canManage = can('quotes.manage')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | QuoteStatus>('all')
  const debounced = useDebouncedValue(query, 300)

  const quotes = useQuotes({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    per_page: 500,
  })

  const rows = useMemo(() => {
    const list = quotes.data?.data ?? []
    if (!debounced.trim()) return list
    const t = debounced.toLowerCase()
    return list.filter(
      (q) =>
        q.patient_name?.toLowerCase().includes(t) ||
        q.code?.toLowerCase().includes(t),
    )
  }, [quotes.data, debounced])

  const totals = useMemo(() => {
    let total = 0
    let pending = 0
    let converted = 0
    rows.forEach((q) => {
      total += q.total
      if (q.status === 'draft' || q.status === 'sent' || q.status === 'accepted') {
        pending += q.total
      }
      if (q.status === 'converted') converted += q.total
    })
    return {
      total: +total.toFixed(2),
      pending: +pending.toFixed(2),
      converted: +converted.toFixed(2),
      count: rows.length,
    }
  }, [rows])

  if (!canManage) return <Navigate to="/" replace />

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-lg ${accent('quotes').badge}`}>
            <FileText className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Cotizaciones
            </h1>
            <p className="text-sm text-muted-foreground">
              Presupuestos emitidos a pacientes. Edítalos o conviértelos en cobro.
            </p>
          </div>
        </div>

        <Button asChild>
          <Link to="/cotizaciones/nueva">
            <Plus className="size-4" /> Nueva cotización
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Cotizaciones
            </p>
            <p className="text-2xl font-semibold tabular-nums">{totals.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total cotizado
            </p>
            <p className="text-2xl font-semibold tabular-nums">{formatMXN(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              En proceso
            </p>
            <p className="text-2xl font-semibold tabular-nums text-amber-700 dark:text-amber-300">
              {formatMXN(totals.pending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Convertido
            </p>
            <p className="text-2xl font-semibold tabular-nums text-violet-700 dark:text-violet-300">
              {formatMXN(totals.converted)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por paciente o código…"
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | QuoteStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Sin cotizaciones con esos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((q) => {
                    const badge = QUOTE_STATUS_BADGE[q.status]
                    return (
                      <TableRow
                        key={q.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/cotizaciones/${q.id}`)}
                      >
                        <TableCell className="font-medium">{q.code ?? `#${q.id}`}</TableCell>
                        <TableCell>{q.patient_name ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge className={badge.className}>{badge.label}</Badge>
                            {q.is_expired ? (
                              <Badge className="bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100">
                                Vencida
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(q.valid_until)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(q.created_at)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {formatMXN(q.total)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
