import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HandCoins,
  History,
  Loader2,
  Printer,
  ReceiptText,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useCommissionPayments,
  useDeleteCommissionPayment,
  usePendingCommissions,
} from '@/features/commissions/hooks'
import { PayCommissionDialog } from '@/features/commissions/PayCommissionDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import type {
  CommissionPayment,
  PendingCommissionGroup,
} from '@/shared/types/commission'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { cn, formatMXN } from '@/shared/lib/utils'
import { accent } from '@/shared/lib/module-accents'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function initials(name: string | null | undefined): string {
  if (!name) return '··'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '··'
}

function PendingGroupCard({ group }: { group: PendingCommissionGroup }) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(group.items.map((i) => i.id)),
  )
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (selected.size === group.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(group.items.map((i) => i.id)))
    }
  }

  const selectedItems = group.items.filter((i) => selected.has(i.id))
  const selectedTotal = selectedItems.reduce(
    (s, i) => s + i.commission_amount,
    0,
  )

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition"
          >
            {open ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials(group.specialist_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">
                {group.specialist_name ?? '—'}
              </p>
              <p className="text-xs text-muted-foreground">
                {group.items_count}{' '}
                {group.items_count === 1 ? 'comisión' : 'comisiones'} ·{' '}
                <span className="text-foreground font-semibold tabular-nums">
                  {formatMXN(group.total_pending)}
                </span>{' '}
                pendientes
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Seleccionado: {formatMXN(selectedTotal)}
            </Badge>
            <Button
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setDialogOpen(true)}
            >
              <CheckCircle2 className="size-4" />
              Pagar selección
            </Button>
          </div>
        </div>

        {open ? (
          <div className="rounded-md border">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary cursor-pointer"
                      checked={
                        selected.size === group.items.length &&
                        group.items.length > 0
                      }
                      onChange={toggleAll}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead>Cobro</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  <TableHead>Cobrado</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((it) => {
                  const isAdvance = it.charge_status !== 'paid'
                  return (
                  <TableRow
                    key={it.id}
                    className={cn(selected.has(it.id) && 'bg-primary/5')}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary cursor-pointer"
                        checked={selected.has(it.id)}
                        onChange={() => toggle(it.id)}
                        aria-label={`Seleccionar item ${it.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {it.charge_code ?? `CHG-${it.charge_id}`}
                      {isAdvance ? (
                        <Badge className="ml-1 bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-100 text-[9px] uppercase">
                          Anticipo
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {it.patient_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">{it.treatment_name}</TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1 min-w-[110px]">
                        <p className="tabular-nums">
                          {formatMXN(it.charge_paid_total)} /{' '}
                          <span className="text-muted-foreground">
                            {formatMXN(it.charge_total)}
                          </span>
                        </p>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              it.charge_paid_ratio >= 1
                                ? 'bg-emerald-500'
                                : it.charge_paid_ratio > 0
                                  ? 'bg-amber-500'
                                  : 'bg-rose-400',
                            )}
                            style={{
                              width: `${Math.min(100, it.charge_paid_ratio * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(it.charge_paid_ratio * 100)}% cobrado
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">
                      {formatMXN(it.commission_amount)}
                      <p className="text-[10px] text-muted-foreground">
                        {it.commission_percent}% de {formatMXN(it.line_total)}
                      </p>
                      {isAdvance && it.commission_paid_share > 0 ? (
                        <p className="text-[10px] text-amber-700 dark:text-amber-300">
                          Devengado: {formatMXN(it.commission_paid_share)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(it.charge_paid_at ?? it.charge_date)}
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <PayCommissionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          group={group}
          selectedItemIds={Array.from(selected)}
        />
      </CardContent>
    </Card>
  )
}

function PaymentRow({ payment }: { payment: CommissionPayment }) {
  const [open, setOpen] = useState(false)
  const remove = useDeleteCommissionPayment()
  const confirm = useConfirm()
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false

  const onDelete = async () => {
    const ok = await confirm({
      title: '¿Eliminar este pago de comisión?',
      description: 'Los items pagados volverán a aparecer como pendientes.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    remove.mutate(payment.id, {
      onSuccess: () => toast.success('Pago eliminado'),
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data
            : undefined
        toast.error(errs?.message ?? 'No fue posible eliminar')
      },
    })
  }

  return (
    <>
      <TableRow
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer hover:bg-muted/40"
      >
        <TableCell className="w-8">
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-xs whitespace-nowrap">
          {formatDateTime(payment.paid_at)}
        </TableCell>
        <TableCell className="text-sm">{payment.specialist_name ?? '—'}</TableCell>
        <TableCell className="text-right text-sm tabular-nums font-medium">
          {formatMXN(payment.amount)}
        </TableCell>
        <TableCell className="text-xs">
          {METHOD_LABEL[payment.method] ?? payment.method}
          {payment.reference ? (
            <p className="text-[10px] text-muted-foreground">{payment.reference}</p>
          ) : null}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground tabular-nums">
          {payment.items_count ?? '—'} items
        </TableCell>
        <TableCell
          className="text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Imprimir"
                  title="Imprimir"
                >
                  <Printer className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `/comisiones/pagos/${payment.id}/imprimir`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <ReceiptText className="size-4" />
                  Recibo (hoja carta)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `/comisiones/pagos/${payment.id}/ticket`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <Printer className="size-4" />
                  Ticket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isAdmin ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={onDelete}
                disabled={remove.isPending}
                aria-label="Eliminar pago"
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      {open ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={7} className="py-3">
            <p className="text-xs text-muted-foreground mb-2">
              {payment.notes ? <span>Notas: {payment.notes}</span> : null}
              {payment.cash_expense_id ? (
                <span className="ml-2">· Registrado como egreso de caja</span>
              ) : null}
            </p>
            {payment.items && payment.items.length > 0 ? (
              <div className="rounded-md border bg-background overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left px-3 py-2 font-medium">Cobro</th>
                      <th className="text-left px-3 py-2 font-medium">Paciente</th>
                      <th className="text-left px-3 py-2 font-medium">Tratamiento</th>
                      <th className="text-right px-3 py-2 font-medium">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.items.map((it) => (
                      <tr key={it.id} className="border-b last:border-b-0">
                        <td className="px-3 py-1.5 font-mono">
                          {it.charge_code ?? `CHG-${it.charge_id}`}
                        </td>
                        <td className="px-3 py-1.5">{it.patient_name ?? '—'}</td>
                        <td className="px-3 py-1.5">{it.treatment_name}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {formatMXN(it.commission_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

export function CommissionsPage() {
  const { data: me } = useMe()
  const canManage = me?.permissions.includes('commissions.manage') ?? false

  const pending = usePendingCommissions()
  const payments = useCommissionPayments({ per_page: 50 })

  if (!canManage) return <Navigate to="/" replace />

  const groups = useMemo(() => pending.data ?? [], [pending.data])
  const totalPending = groups.reduce((s, g) => s + g.total_pending, 0)
  const totalSpecialists = groups.length

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg ${accent('reports').badge}`}>
          <HandCoins className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pago de comisiones
          </h1>
          <p className="text-sm text-muted-foreground">
            Liquidación de comisiones a especialistas y bitácora de pagos. Puedes
            adelantar comisiones de cobros con saldo pendiente.
          </p>
        </div>
      </header>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pendientes de pago</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.isPending ? (
            <Skeleton className="h-48 w-full" />
          ) : groups.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                <Sparkles className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay comisiones pendientes. ¡Todo al corriente!
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Solo se consideran cobros con estado «Pagado».
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <Loader2 className="size-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">
                        {totalSpecialists} {totalSpecialists === 1 ? 'especialista' : 'especialistas'} con saldo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Selecciona los items y marca pagado para cada uno
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Total pendiente
                    </p>
                    <p className="text-xl font-semibold tabular-nums text-foreground">
                      {formatMXN(totalPending)}
                    </p>
                  </div>
                </div>
              </Card>

              {groups.map((g) => (
                <PendingGroupCard key={g.specialist_id} group={g} />
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="whitespace-nowrap">Fecha</TableHead>
                  <TableHead>Especialista</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.isPending ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (payments.data?.data.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                        <History className="size-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Aún no hay pagos de comisiones registrados.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.data!.data.map((p) => (
                    <PaymentRow key={p.id} payment={p} />
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
