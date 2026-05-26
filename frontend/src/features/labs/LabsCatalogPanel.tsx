import { useMemo, useState } from 'react'
import { Building2, Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteLab, useLabs } from './hooks'
import { LabFormDialog } from './LabFormDialog'
import { useMe } from '@/features/auth/hooks'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { Lab } from '@/shared/types/lab'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

export function LabsCatalogPanel() {
  const { data: me } = useMe()
  const canWrite = me?.permissions.includes('catalogs.manage') ?? false

  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 350)
  const labs = useLabs({ q: debounced })
  const remove = useDeleteLab()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Lab | null>(null)

  const rows = useMemo(() => labs.data ?? [], [labs.data])

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const onEdit = (l: Lab) => {
    setEditing(l)
    setOpen(true)
  }
  const onDelete = (l: Lab) => {
    if (!window.confirm(`¿Eliminar el laboratorio "${l.name}"?`)) return
    remove.mutate(l.id, {
      onSuccess: () => toast.success('Laboratorio eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, contacto o teléfono…"
            className="pl-9"
          />
        </div>
        {canWrite ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nuevo laboratorio
          </Button>
        ) : null}
      </div>

      <Card>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Laboratorio</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead className="text-right">Órdenes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labs.isPending ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Building2 className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {debounced
                      ? `Sin resultados para "${debounced}"`
                      : 'Aún no hay laboratorios registrados.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{l.name}</p>
                    {l.address ? (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {l.address}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    {l.contact_name ? (
                      <p className="font-medium text-foreground">{l.contact_name}</p>
                    ) : null}
                    {l.phone ? (
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Phone className="size-3" /> {l.phone}
                      </p>
                    ) : null}
                    {l.email ? (
                      <p className="text-muted-foreground inline-flex items-center gap-1">
                        <Mail className="size-3" /> {l.email}
                      </p>
                    ) : null}
                    {!l.contact_name && !l.phone && !l.email ? '—' : null}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {l.orders_count ?? 0}
                  </TableCell>
                  <TableCell>
                    {l.active ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {canWrite ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(l)}
                        aria-label={`Editar ${l.name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    ) : null}
                    {me?.roles.includes('admin') ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(l)}
                        aria-label={`Eliminar ${l.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <LabFormDialog open={open} onOpenChange={setOpen} lab={editing} />
    </div>
  )
}
