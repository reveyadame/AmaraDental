import { useState } from 'react'
import { History, LockKeyhole } from 'lucide-react'
import { useCashSessions } from '@/features/cash/hooks'
import { CashSessionDetailDialog } from '@/features/cash/CashSessionDetailDialog'
import { Card } from '@/shared/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cn, formatMXN } from '@/shared/lib/utils'
import { accent } from '@/shared/lib/module-accents'
import type { CashSession } from '@/shared/types/cash'

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function diffCell(d: number | null) {
  if (d === null || d === undefined) return <span className="text-muted-foreground">—</span>
  const tone = d === 0 ? 'text-muted-foreground' : d > 0 ? 'text-emerald-600' : 'text-destructive'
  return (
    <span className={cn('tabular-nums font-medium', tone)}>
      {d >= 0 ? '+' : ''}
      {formatMXN(d)}
    </span>
  )
}

export function CashSessionsHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const sessions = useCashSessions({
    status: statusFilter === 'all' ? undefined : statusFilter,
    per_page: 100,
  })
  const [detailId, setDetailId] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('cash').badge}`}>
          <History className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Historial de cortes
          </h1>
          <p className="text-sm text-muted-foreground">
            Cortes de caja realizados por los usuarios, con sus diferencias por método.
          </p>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {sessions.data?.data.length ?? 0} cortes en el filtro actual
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="closed">Cerrados</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Abierta por</TableHead>
              <TableHead>Cerrada por</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Cobros</TableHead>
              <TableHead className="text-right">Dif. efectivo</TableHead>
              <TableHead className="text-right">Dif. tarjeta</TableHead>
              <TableHead className="text-right">Dif. transf.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : (sessions.data?.data.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <LockKeyhole className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aún no hay cortes registrados.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              sessions.data!.data.map((s: CashSession) => {
                const totalCharges = s.payments_summary?.total ?? 0
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetailId(s.id)}
                  >
                    <TableCell className="font-mono text-xs">#{s.id}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">
                        {s.opened_by_name ?? s.user_name ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">
                        {s.closed_by_name ?? (s.closed_at ? '—' : '')}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(s.opened_at)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(s.closed_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'open' ? 'default' : 'secondary'}>
                        {s.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMXN(totalCharges)}
                    </TableCell>
                    <TableCell className="text-right">
                      {diffCell(s.difference)}
                    </TableCell>
                    <TableCell className="text-right">
                      {diffCell(s.card_difference)}
                    </TableCell>
                    <TableCell className="text-right">
                      {diffCell(s.transfer_difference)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <CashSessionDetailDialog
        sessionId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  )
}
