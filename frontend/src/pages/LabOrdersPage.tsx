import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  Microscope,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useDeleteLabOrder,
  useLabOrders,
} from '@/features/labs/hooks'
import { LabOrderFormDialog } from '@/features/labs/LabOrderFormDialog'
import { LabOrderStatusMenu } from '@/features/labs/LabOrderStatusMenu'
import { LabsCatalogPanel } from '@/features/labs/LabsCatalogPanel'
import { useMe } from '@/features/auth/hooks'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
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
import { cn, formatMXN } from '@/shared/lib/utils'
import { accent } from '@/shared/lib/module-accents'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import {
  LAB_ORDER_STATUS_LABELS,
  type LabOrder,
} from '@/shared/types/lab'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-900 border-slate-200',
  in_progress: 'bg-amber-100 text-amber-900 border-amber-200',
  received: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  delivered: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-muted text-muted-foreground border-dashed',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isOverdue(order: LabOrder): boolean {
  if (!order.due_on) return false
  if (order.status === 'received' || order.status === 'delivered') return false
  if (order.status === 'cancelled') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(order.due_on + 'T00:00:00') < today
}

export function LabOrdersPage() {
  const { data: me } = useMe()
  const canWrite = me?.permissions.includes('labs.manage') ?? false

  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LabOrder | null>(null)
  const debouncedQ = useDebouncedValue(q, 350)
  const remove = useDeleteLabOrder()

  const query = useMemo(() => {
    if (statusFilter === 'open') {
      return { q: debouncedQ || undefined, per_page: 50 }
    }
    if (statusFilter === 'overdue') {
      return { overdue: true, q: debouncedQ || undefined, per_page: 50 }
    }
    return { status: statusFilter, q: debouncedQ || undefined, per_page: 50 }
  }, [statusFilter, debouncedQ])

  const orders = useLabOrders(query)

  const rows = useMemo(() => {
    const all = orders.data?.data ?? []
    if (statusFilter === 'open') {
      // "Abiertas" = excluye entregadas y canceladas (vista por defecto).
      return all.filter(
        (o) => o.status !== 'delivered' && o.status !== 'cancelled',
      )
    }
    return all
  }, [orders.data, statusFilter])

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const onEdit = (o: LabOrder) => {
    setEditing(o)
    setOpen(true)
  }
  const onDelete = (o: LabOrder) => {
    if (!window.confirm(`¿Eliminar la orden de ${o.patient_name ?? 'paciente'}?`))
      return
    remove.mutate(o.id, {
      onSuccess: () => toast.success('Orden eliminada'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-lg ${accent('labs').badge}`}>
            <Microscope className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Laboratorios
            </h1>
            <p className="text-sm text-muted-foreground">
              Órdenes a laboratorios externos: coronas, prótesis y trabajos personalizados.
            </p>
          </div>
        </div>
        {canWrite ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nueva orden
          </Button>
        ) : null}
      </header>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo de laboratorios</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por laboratorio o tipo de trabajo…"
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Abiertas (todas)</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="in_progress">En proceso</SelectItem>
              <SelectItem value="received">Recibidas</SelectItem>
              <SelectItem value="delivered">Entregadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Trabajo</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="whitespace-nowrap">Enviada</TableHead>
              <TableHead className="whitespace-nowrap">Esperada</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Microscope className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {debouncedQ
                      ? `Sin resultados para "${debouncedQ}"`
                      : 'Aún no hay órdenes de laboratorio.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => {
                const overdue = isOverdue(o)
                return (
                  <TableRow
                    key={o.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/40',
                      overdue && 'bg-rose-50/40 dark:bg-rose-950/10',
                    )}
                    onClick={() => onEdit(o)}
                  >
                    <TableCell>
                      <Link
                        to={`/pacientes/${o.patient_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium hover:underline"
                      >
                        {o.patient_name ?? '—'}
                      </Link>
                      {o.dentist_name ? (
                        <p className="text-xs text-muted-foreground">
                          {o.dentist_name}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{o.work_type ?? '—'}</p>
                      {o.treatment_name ? (
                        <p className="text-xs text-muted-foreground">
                          {o.treatment_name}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {o.lab_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('font-normal', STATUS_BADGE[o.status])}
                      >
                        {LAB_ORDER_STATUS_LABELS[o.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <CalendarClock className="inline size-3 mr-1" />
                      {formatDate(o.sent_on)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                          <AlertTriangle className="size-3" />
                          {formatDate(o.due_on)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatDate(o.due_on)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMXN(o.cost)}
                    </TableCell>
                    <TableCell
                      className="text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-0.5">
                        <LabOrderStatusMenu order={o} />
                        {canWrite ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(o)}
                            aria-label={`Editar orden de ${o.patient_name ?? 'paciente'}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        ) : null}
                        {me?.roles.includes('admin') ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => onDelete(o)}
                            aria-label={`Eliminar orden de ${o.patient_name ?? 'paciente'}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

        </TabsContent>

        <TabsContent value="catalog">
          <LabsCatalogPanel />
        </TabsContent>
      </Tabs>

      <LabOrderFormDialog open={open} onOpenChange={setOpen} order={editing} />
    </div>
  )
}
