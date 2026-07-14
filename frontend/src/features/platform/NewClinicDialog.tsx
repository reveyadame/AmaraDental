import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Copy, Loader2, Plus } from 'lucide-react'
import { useCreateTenant, usePlans } from './hooks'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

export function NewClinicDialog() {
  const create = useCreateTenant()
  const plans = usePlans()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('')
  const [planKey, setPlanKey] = useState('esencial')
  const [created, setCreated] = useState<{ slug: string; password: string } | null>(null)

  const reset = () => {
    setName('')
    setSlug('')
    setAdminEmail('')
    setAdminName('')
    setPlanKey('esencial')
    setCreated(null)
  }

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) reset()
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      {
        name,
        slug: slug || undefined,
        admin_email: adminEmail,
        admin_name: adminName || undefined,
        plan_key: planKey,
      },
      {
        onSuccess: (res) => setCreated({ slug: res.tenant.slug, password: res.admin_password }),
        onError: (err) => toast.error(getApiErrorMessage(err, 'No fue posible crear la clínica')),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nueva clínica
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" /> Clínica creada
              </DialogTitle>
              <DialogDescription>
                Guarda la contraseña del administrador — no se vuelve a mostrar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Subdominio (slug)</p>
                <p className="font-mono text-sm">{created.slug}</p>
              </div>
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Contraseña del administrador</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm">{created.password}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(created.password)
                      toast.success('Contraseña copiada')
                    }}
                  >
                    <Copy className="size-3.5" /> Copiar
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => onOpenChange(false)}>
                Listo
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nueva clínica</DialogTitle>
              <DialogDescription>
                Crea la clínica y su usuario administrador inicial.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Nombre de la clínica</Label>
                <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cslug">Slug (subdominio) — opcional</Label>
                <Input
                  id="cslug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="se deriva del nombre"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">Email del administrador</Label>
                <Input
                  id="cemail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caname">Nombre del administrador — opcional</Label>
                <Input
                  id="caname"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Administrador"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={planKey} onValueChange={setPlanKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.data?.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.name} —{' '}
                        {p.max_patients === null
                          ? 'pacientes ilimitados'
                          : `${p.max_patients} pacientes`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={create.isPending}>
                {create.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Crear clínica
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
