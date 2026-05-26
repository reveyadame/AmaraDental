import { useEffect, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateUser, useUpdateUser } from './hooks'
import type { Role, User } from '@/shared/types/api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { ALL_ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@/shared/auth/permissions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
}

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const isEdit = !!user
  const create = useCreateUser()
  const update = useUpdateUser(user?.id ?? 0)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])

  useEffect(() => {
    if (!open) return
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone ?? '')
      setPassword('')
      setActive(user.active)
      setRoles(user.roles)
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setActive(true)
      setRoles([])
    }
  }, [open, user])

  const toggleRole = (r: Role) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Captura el nombre')
    if (!email.trim()) return toast.error('Captura el correo')
    if (!isEdit && password.length < 8) {
      return toast.error('La contraseña debe tener al menos 8 caracteres')
    }
    if (isEdit && password && password.length < 8) {
      return toast.error('La nueva contraseña debe tener al menos 8 caracteres')
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      active,
      roles,
    }
    if (password) payload.password = password

    const mut = isEdit ? update : create
    mut.mutate(payload as never, {
      onSuccess: () => {
        toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado')
        onOpenChange(false)
      },
      onError: (err: unknown) => {
        const errs =
          err && typeof err === 'object' && 'response' in err
            ? (err as {
                response?: { data?: { message?: string; errors?: Record<string, string[]> } }
              }).response?.data
            : undefined
        const first = errs?.errors ? Object.values(errs.errors)[0]?.[0] : errs?.message
        toast.error(first ?? 'No fue posible guardar')
      },
    })
  }

  const pending = create.isPending || update.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </DialogTitle>
          <DialogDescription>
            Asigna uno o varios roles. Cada rol abre los módulos correspondientes.
            Sin rol asignado, el usuario no podrá acceder a nada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="password">
                {isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                autoComplete="new-password"
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <Label>Rol(es)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_ROLES.map((r) => {
                const isActive = roles.includes(r)
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                  >
                    <div className="text-sm font-medium">{ROLE_LABEL[r]}</div>
                    <div className="text-[10px] leading-tight mt-0.5 opacity-80">
                      {ROLE_DESCRIPTION[r]}
                    </div>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 accent-primary cursor-pointer"
            />
            <span className="text-sm">
              Usuario <span className="font-medium">{active ? 'activo' : 'inactivo'}</span>
              <span className="block text-xs text-muted-foreground">
                Los inactivos no pueden iniciar sesión.
              </span>
            </span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
