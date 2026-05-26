import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Plus, Printer, ReceiptText, Wallet } from 'lucide-react'
import { usePatientAccount } from './hooks'
import { ChargeDetailDialog } from './ChargeDetailDialog'
import { useMe } from '@/features/auth/hooks'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Separator } from '@/shared/ui/separator'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { cn, formatMXN } from '@/shared/lib/utils'
import { CHARGE_STATUS_BADGE } from '@/shared/types/cash'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PatientAccountTab({ patientId }: { patientId: number }) {
  const { data: me } = useMe()
  const canCharge = me?.permissions.includes('charges.create') ?? false
  const account = usePatientAccount(patientId)
  const [detailId, setDetailId] = useState<number | null>(null)

  if (account.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!account.data) return null

  const a = account.data
  const hasBalance = a.totals.balance > 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total facturado
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatMXN(a.totals.invoiced)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {a.totals.charges_count} cobros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total pagado
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600">
              {formatMXN(a.totals.paid)}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(hasBalance && 'border-amber-400/60 bg-amber-50/40')}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Saldo pendiente
            </p>
            <p
              className={cn(
                'mt-1 text-xl font-semibold tabular-nums',
                hasBalance ? 'text-amber-700' : 'text-foreground',
              )}
            >
              {formatMXN(a.totals.balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {a.totals.pending_count} cobros con saldo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Descuentos
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-muted-foreground">
              − {formatMXN(a.totals.discounts)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-base font-semibold text-foreground">Movimientos</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `/pacientes/${patientId}/cuenta/imprimir`,
                '_blank',
                'noopener',
              )
            }
          >
            <Printer className="size-4" /> Imprimir / PDF
          </Button>
          {canCharge ? (
            <Button asChild size="sm">
              <Link to="/caja/nuevo">
                <Plus className="size-4" /> Nuevo cobro
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {a.charges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
              <ReceiptText className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Este paciente no tiene cobros registrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Folio</TableHead>
                <TableHead>Tratamientos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.charges.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailId(c.id)}
                >
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(c.created_at)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {c.code ?? `CHG-${c.id}`}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[16rem]">
                    {c.items && c.items.length > 0 ? (
                      <>
                        {c.items[0]?.treatment_name}
                        {c.items.length > 1 ? (
                          <span className="text-muted-foreground">
                            {' '}
                            · +{c.items.length - 1} más
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMXN(c.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatMXN(c.paid_total)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right tabular-nums font-medium',
                      c.balance > 0 && c.status !== 'cancelled' ? 'text-amber-700' : 'text-muted-foreground',
                    )}
                  >
                    {c.balance > 0 ? formatMXN(c.balance) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={CHARGE_STATUS_BADGE[c.status].className}>
                      {CHARGE_STATUS_BADGE[c.status].label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {a.totals.invoiced > 0 ? (
            <>
              <Separator />
              <div className="p-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Facturado</p>
                  <p className="tabular-nums font-medium">
                    {formatMXN(a.totals.invoiced)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagado</p>
                  <p className="tabular-nums font-medium text-emerald-600">
                    {formatMXN(a.totals.paid)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p
                    className={cn(
                      'tabular-nums font-semibold text-base',
                      hasBalance ? 'text-amber-700' : 'text-foreground',
                    )}
                  >
                    {formatMXN(a.totals.balance)}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      )}

      {hasBalance && canCharge ? (
        <Card className="border-amber-400/60 bg-amber-50/40">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-amber-700" />
              <p className="text-sm">
                Hay {a.totals.pending_count} cobro
                {a.totals.pending_count === 1 ? '' : 's'} con saldo. Total a cobrar:{' '}
                <span className="font-semibold">{formatMXN(a.totals.balance)}</span>
              </p>
            </div>
            <Button size="sm" asChild>
              <Link
                to={`/caja/cobros/${
                  a.charges.find((c) => c.balance > 0 && c.status !== 'cancelled')?.id
                }/pagar`}
              >
                <CreditCard className="size-4" /> Cobrar el más antiguo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <ChargeDetailDialog
        chargeId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />
    </div>
  )
}
