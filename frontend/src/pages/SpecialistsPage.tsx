import { useState } from 'react'
import { Pencil, Percent, Plus, Search, Stethoscope, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteSpecialist, useSpecialists } from '@/features/specialists/hooks'
import { SpecialistProfileDialog } from '@/features/specialists/SpecialistProfileDialog'
import { SpecialistCreateDialog } from '@/features/specialists/SpecialistCreateDialog'
import { CommissionsDialog } from '@/features/specialists/CommissionsDialog'
import { specialtyLabel } from '@/features/specialists/specialties'
import { useAuth } from '@/shared/auth/permissions'
import { useConfirm } from '@/shared/ui/confirm'
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
import type { Specialist } from '@/shared/types/api'

export function SpecialistsPage() {
  const { can, isAdmin } = useAuth()
  const canManage = can('catalogs.manage')
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query, 350)
  const specialists = useSpecialists(debounced)
  const [editing, setEditing] = useState<Specialist | null>(null)
  const [commissionsFor, setCommissionsFor] = useState<Specialist | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const del = useDeleteSpecialist()
  const confirm = useConfirm()

  const onDelete = async (s: Specialist) => {
    const ok = await confirm({
      title: `¿Marcar "${s.name}" como inactivo?`,
      description:
        'Quedará oculto en los selectores pero se mantiene el historial.',
      confirmText: 'Desactivar',
      variant: 'destructive',
    })
    if (!ok) return
    del.mutate(s.id, {
      onSuccess: () => toast.success('Especialista desactivado'),
      onError: () => toast.error('No fue posible desactivar'),
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Especialistas
          </h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de dentistas: nombre, cédula, especialidad y comisión por defecto.
            No son usuarios del sistema — no inician sesión.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Nuevo especialista
          </Button>
        ) : null}
      </header>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, especialidad o cédula…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Especialista</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Especialidad</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead>Estado</TableHead>
              {canManage ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {specialists.isPending ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 6 : 5}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : specialists.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <Stethoscope className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {debounced
                      ? `Sin resultados para "${debounced}"`
                      : 'Aún no hay especialistas registrados.'}
                  </p>
                  {!debounced && canManage ? (
                    <Button variant="link" onClick={() => setCreateOpen(true)}>
                      Crear el primer especialista
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : (
              specialists.data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {s.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </span>
                      <div>
                        <div className="font-medium text-foreground">{s.name}</div>
                        {s.bio ? (
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">
                            {s.bio}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {s.cedula_profesional ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {specialtyLabel(s.specialty)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.default_commission_percent != null
                      ? `${s.default_commission_percent}%`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCommissionsFor(s)}
                          title="Comisiones por tratamiento"
                        >
                          <Percent className="size-4" /> Comisiones
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {s.active && isAdmin ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => onDelete(s)}
                            aria-label="Desactivar especialista"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {editing ? (
        <SpecialistProfileDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          specialist={editing}
        />
      ) : null}

      <SpecialistCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {commissionsFor ? (
        <CommissionsDialog
          open={!!commissionsFor}
          onOpenChange={(o) => !o && setCommissionsFor(null)}
          specialist={commissionsFor}
        />
      ) : null}
    </div>
  )
}
