import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Stethoscope, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteTreatment, useTreatments } from './hooks'
import { TreatmentFormDialog } from './TreatmentFormDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card } from '@/shared/ui/card'
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
import { formatMXN } from '@/shared/lib/utils'
import type { Treatment } from '@/shared/types/catalog'

export function TreatmentsListPanel() {
  const { data: me } = useMe()
  const isAdmin = me?.roles.includes('admin') ?? false

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const debounced = useDebouncedValue(query, 350)
  const treatments = useTreatments({ q: debounced })
  const remove = useDeleteTreatment()
  const confirm = useConfirm()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Treatment | null>(null)

  const categories = useMemo(() => {
    const set = new Set<string>()
    treatments.data?.forEach((t) => t.category && set.add(t.category))
    return Array.from(set).sort()
  }, [treatments.data])

  const rows = useMemo(
    () =>
      treatments.data?.filter((t) => category === 'all' || t.category === category) ?? [],
    [treatments.data, category],
  )

  const onEdit = (t: Treatment) => {
    setEditing(t)
    setOpen(true)
  }

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }

  const onDelete = async (t: Treatment) => {
    const ok = await confirm({
      title: `¿Eliminar tratamiento "${t.name}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    remove.mutate(t.id, {
      onSuccess: () => toast.success('Tratamiento eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin ? (
          <Button onClick={onNew}>
            <Plus className="size-4" /> Nuevo tratamiento
          </Button>
        ) : null}
      </div>

      <Card>
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Tratamiento</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Duración</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead>Recall</TableHead>
              {isAdmin ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {treatments.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={isAdmin ? 7 : 6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Stethoscope className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {debounced ? `Sin resultados para "${debounced}"` : 'Aún no hay tratamientos.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{t.name}</div>
                    {t.code ? (
                      <div className="text-xs text-muted-foreground font-mono">{t.code}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {t.category ? (
                      <Badge variant="outline" className="font-normal">
                        {t.category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMXN(t.base_price)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {t.duration_minutes} min
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {t.commission_percent != null ? `${t.commission_percent}%` : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.periodicity_days ? (
                      <span>
                        {t.recall_label ?? `Cada ${t.periodicity_days} días`}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  {isAdmin ? (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onDelete(t)}
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

      <TreatmentFormDialog open={open} onOpenChange={setOpen} treatment={editing} />
    </div>
  )
}
