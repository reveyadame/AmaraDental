import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Plus, ScrollText, Search, Trash2 } from 'lucide-react'
import { useDeleteTemplate, useTemplates } from '@/features/prescriptions/hooks'
import { PrescriptionTemplateFormDialog } from '@/features/prescriptions/PrescriptionTemplateFormDialog'
import { useMe } from '@/features/auth/hooks'
import type { PrescriptionTemplate } from '@/shared/types/prescription'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
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
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'

export function PrescriptionTemplatesPage() {
  const { data: me } = useMe()
  const canManage =
    (me?.permissions.includes('prescriptions.create') ||
      me?.permissions.includes('catalogs.manage')) ??
    false
  // Eliminar plantillas queda reservado al administrador.
  const isAdmin = me?.roles.includes('admin') ?? false
  if (me && !canManage) return <Navigate to="/" replace />
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 350)
  const templates = useTemplates(debounced || undefined)
  const del = useDeleteTemplate()
  const [editing, setEditing] = useState<PrescriptionTemplate | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const onDelete = (t: PrescriptionTemplate) => {
    if (!window.confirm(`¿Eliminar plantilla "${t.name}"?`)) return
    del.mutate(t.id, {
      onSuccess: () => toast.success('Plantilla eliminada'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Plantillas de recetas
          </h1>
          <p className="text-sm text-muted-foreground">
            Reutiliza combinaciones de medicamentos al emitir una receta para acelerar la captura.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nueva plantilla
          </Button>
        ) : null}
      </header>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Plantilla</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Medicamentos</TableHead>
              <TableHead>Creado por</TableHead>
              {canManage ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 5 : 4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : templates.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <ScrollText className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {debounced
                      ? `Sin resultados para "${debounced}"`
                      : 'Aún no hay plantillas registradas.'}
                  </p>
                  {!debounced && canManage ? (
                    <Button variant="link" onClick={() => setCreateOpen(true)}>
                      Crear la primera plantilla
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              templates.data?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{t.name}</p>
                      {t.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {t.description}
                        </p>
                      ) : null}
                    </div>
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
                    {t.items_count ?? t.items.length}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.created_by_name ?? '—'}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      {isAdmin ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PrescriptionTemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing ? (
        <PrescriptionTemplateFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          template={editing}
        />
      ) : null}
    </div>
  )
}
