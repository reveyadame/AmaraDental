import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Pencil, Plus, Search, Trash2, Users as UsersIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteUser, useUsers } from '@/features/users/hooks'
import { UserFormDialog } from '@/features/users/UserFormDialog'
import { useMe } from '@/features/auth/hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { User } from '@/shared/types/api'
import { Avatar, AvatarFallback } from '@/shared/ui/avatar'
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
import { cn } from '@/shared/lib/utils'
import { accent } from '@/shared/lib/module-accents'
import { ROLE_LABEL } from '@/shared/auth/permissions'
import type { Role } from '@/shared/types/api'

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  agenda: 'bg-blue-100 text-blue-900 border-blue-200',
  pacientes: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  catalogos: 'bg-sky-100 text-sky-900 border-sky-200',
  caja: 'bg-amber-100 text-amber-900 border-amber-200',
  cotizaciones: 'bg-lime-100 text-lime-900 border-lime-200',
  pago_comisiones: 'bg-violet-100 text-violet-900 border-violet-200',
  membresias: 'bg-pink-100 text-pink-900 border-pink-200',
  laboratorios: 'bg-orange-100 text-orange-900 border-orange-200',
  recalls: 'bg-teal-100 text-teal-900 border-teal-200',
  reportes: 'bg-slate-100 text-slate-900 border-slate-200',
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '··'
}

export function UsersPage() {
  const { data: me } = useMe()
  const isAdmin = (me?.permissions.includes('users.manage')) ?? false

  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 350)
  const users = useUsers({ q: debouncedQ, per_page: 50 })
  const remove = useDeleteUser()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  if (!isAdmin) return <Navigate to="/" replace />

  const onNew = () => {
    setEditing(null)
    setOpen(true)
  }
  const onEdit = (u: User) => {
    setEditing(u)
    setOpen(true)
  }
  const onDelete = async (u: User) => {
    if (u.id === me?.id) {
      toast.error('No puedes eliminar tu propio usuario')
      return
    }
    const ok = await confirm({
      title: `¿Eliminar a "${u.name}"?`,
      description: 'El usuario perderá acceso al sistema. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'destructive',
    })
    if (!ok) return
    remove.mutate(u.id, {
      onSuccess: () => toast.success('Usuario eliminado'),
      onError: () => toast.error('No fue posible eliminar'),
    })
  }

  const rows = users.data?.data ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-lg ${accent('users').badge}`}>
            <UsersIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Usuarios
            </h1>
            <p className="text-sm text-muted-foreground">
              Personas con acceso al sistema. Asígnales uno o varios roles base y
              permisos extra cuando lo necesiten.
            </p>
          </div>
        </div>
        <Button onClick={onNew}>
          <Plus className="size-4" /> Nuevo usuario
        </Button>
      </header>

      <Card className="p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-14 text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted mb-2">
                    <UsersIcon className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {debouncedQ
                      ? `Sin resultados para "${debouncedQ}"`
                      : 'Aún no hay usuarios registrados.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {u.name}
                          {u.id === me?.id ? (
                            <span className="ml-2 text-[10px] text-primary uppercase tracking-wide">
                              tú
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sin rol</span>
                      ) : (
                        u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant="outline"
                            className={cn('font-normal', ROLE_BADGE[r])}
                          >
                            {ROLE_LABEL[r] ?? r}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge className="bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(u)}
                      aria-label={`Editar ${u.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDelete(u)}
                      disabled={u.id === me?.id}
                      aria-label={`Eliminar ${u.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <UserFormDialog open={open} onOpenChange={setOpen} user={editing} />
    </div>
  )
}
