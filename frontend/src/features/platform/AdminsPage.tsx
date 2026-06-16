import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react'
import { useAdmins, useCreateAdmin, useDeleteAdmin, useUpdateAdmin } from './hooks'
import { useConfirm } from '@/shared/ui/confirm'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import type { PlatformAdminAccount } from './api'

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Nunca'

function AdminFormDialog({
  admin,
  open,
  onOpenChange,
}: {
  admin: PlatformAdminAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isEdit = admin !== null
  const create = useCreateAdmin()
  const update = useUpdateAdmin()
  const [name, setName] = useState(admin?.name ?? '')
  const [email, setEmail] = useState(admin?.email ?? '')
  const [password, setPassword] = useState('')

  const pending = create.isPending || update.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const onError = (err: unknown) =>
      toast.error(getApiErrorMessage(err, 'No fue posible guardar el administrador'))

    if (isEdit) {
      update.mutate(
        { id: admin.id, name: name.trim(), email: email.trim(), password: password || undefined },
        {
          onSuccess: () => {
            toast.success('Administrador actualizado')
            onOpenChange(false)
          },
          onError,
        },
      )
    } else {
      create.mutate(
        { name: name.trim(), email: email.trim(), password },
        {
          onSuccess: () => {
            toast.success('Administrador creado')
            onOpenChange(false)
          },
          onError,
        },
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar administrador' : 'Nuevo administrador'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Actualiza los datos. Deja la contraseña vacía para no cambiarla.'
                : 'Tendrá acceso completo al panel de plataforma.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-name">Nombre</Label>
              <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">
                {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Sin cambios' : 'Mínimo 8 caracteres'}
                minLength={isEdit ? undefined : 8}
                required={!isEdit}
                autoComplete="new-password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminsPage({ adminId }: { adminId: number }) {
  const admins = useAdmins()
  const update = useUpdateAdmin()
  const remove = useDeleteAdmin()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<PlatformAdminAccount | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (a: PlatformAdminAccount) => {
    setEditing(a)
    setFormOpen(true)
  }

  const toggleActive = (a: PlatformAdminAccount) => {
    update.mutate(
      { id: a.id, active: !a.active },
      {
        onSuccess: () => toast.success(a.active ? 'Administrador desactivado' : 'Administrador activado'),
        onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible cambiar el estado')),
      },
    )
  }

  const del = async (a: PlatformAdminAccount) => {
    const ok = await confirm({
      title: `¿Eliminar a ${a.name}?`,
      description: 'Perderá el acceso al panel de plataforma de inmediato.',
      variant: 'destructive',
      confirmText: 'Eliminar',
    })
    if (!ok) return
    remove.mutate(a.id, {
      onSuccess: () => toast.success('Administrador eliminado'),
      onError: (e) => toast.error(getApiErrorMessage(e, 'No fue posible eliminar')),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administradores</h1>
          <p className="text-sm text-muted-foreground">
            Super-admins con acceso al panel de plataforma.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {admins.isPending ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.data?.map((a) => {
                const isSelf = a.id === adminId
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                        {a.name}
                        {isSelf ? (
                          <Badge variant="outline" className="text-[10px]">
                            Tú
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                    <TableCell>
                      {a.active ? (
                        <Badge variant="secondary">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmtDate(a.last_login_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(a)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title={a.active ? 'Desactivar' : 'Activar'}
                          onClick={() => toggleActive(a)}
                          disabled={isSelf || update.isPending}
                        >
                          {a.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => del(a)}
                          disabled={isSelf || remove.isPending}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <AdminFormDialog
        key={`${editing?.id ?? 'new'}-${formOpen}`}
        admin={editing}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  )
}
