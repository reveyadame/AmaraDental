import { useState, type FormEvent } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { usePlatformLogin } from './hooks'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function PlatformLoginPage() {
  const login = usePlatformLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    login.mutate(
      { email, password },
      { onError: (err) => setError(getApiErrorMessage(err, 'No fue posible iniciar sesión')) },
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              AD
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{DEFAULT_BRAND_NAME}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Plataforma</p>
            </div>
          </div>
          <CardTitle className="text-xl">Panel de administración</CardTitle>
          <CardDescription>
            Acceso exclusivo para el equipo de {DEFAULT_BRAND_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="pemail">Correo</Label>
              <Input
                id="pemail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ppass">Contraseña</Label>
              <Input
                id="ppass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
