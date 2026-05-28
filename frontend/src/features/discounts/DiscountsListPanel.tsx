import { useState } from 'react'
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteDiscount, useDiscounts } from './hooks'
import { DiscountFormDialog } from './DiscountFormDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { Button } from '@/shared/ui/button'
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
import { formatMXN } from '@/shared/lib/utils'
import type { Discount } from '@/shared/types/catalog'

export function DiscountsListPanel() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false
  const discounts = useDiscounts()
  const remove = useDeleteDiscount()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)

  const onEdit = (d: Discount) => {
    setEditing(d)
    setOpen(true)
  }
  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const onDelete = async (d: Discount) => {
    const ok = await confirm({
      title: `¿Eliminar "${d.name}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    remove.mutate(d.id, {
      onSuccess: () => toast.success('Descuento eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Aplicables manualmente al cobrar. Pueden ser por porcentaje o monto fijo.
        </p>
        {isAdmin ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nuevo descuento
          </Button>
        ) : null}
      </div>

      <Card>
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Alcance</TableHead>
              <TableHead>Vigencia</TableHead>
              {isAdmin ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isAdmin ? 6 : 5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : discounts.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Tag className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Aún no hay descuentos.</p>
                </TableCell>
              </TableRow>
            ) : (
              discounts.data?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {d.type === 'percent' ? 'Porcentaje' : 'Monto fijo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.type === 'percent' ? `${d.value}%` : formatMXN(d.value)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.scope === 'global'
                      ? 'Cualquier tratamiento'
                      : d.treatment?.name ?? 'Tratamiento específico'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {d.valid_from || d.valid_to
                      ? `${d.valid_from ?? '∞'} → ${d.valid_to ?? '∞'}`
                      : 'Sin vigencia'}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(d)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(d)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <DiscountFormDialog open={open} onOpenChange={setOpen} discount={editing} />
    </div>
  )
}
