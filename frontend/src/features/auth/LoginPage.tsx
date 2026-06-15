import { useState } from 'react'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { useBranding, useLogin, useMe } from './hooks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { getApiErrorMessage } from '@/shared/lib/api-error'

const loginSchema = z.object({
  email: z.string().min(1, 'Requerido').email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { data: me, isPending } = useMe()
  const { data: branding } = useBranding()
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  if (isPending) return null
  if (me) return <Navigate to="/" replace />

  // Marca de la clínica (white-label) para el formulario; marca de plataforma
  // (Amara Dental) para el panel lateral y el footer.
  const clinicName = branding?.brand_name ?? DEFAULT_BRAND_NAME
  const initialsOf = (name: string) =>
    name
      .split(/\s+/)
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase()
  const platformInitials = initialsOf(DEFAULT_BRAND_NAME)
  const year = new Date().getFullYear()

  const onSubmit = (values: LoginForm) =>
    loginMutation.mutate(values, {
      onError: (error: unknown) => {
        setError('email', {
          type: 'server',
          message: getApiErrorMessage(error, 'No fue posible iniciar sesión'),
        })
      },
    })

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 py-10">
        <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-sm border-none shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-2">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold tracking-tight">
              {platformInitials}
            </div>
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión en {clinicName} para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="dentista@clinica.mx"
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-0 top-0 grid h-full w-10 place-items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="size-4 rounded border" {...register('remember')} />
                Mantener sesión iniciada
              </label>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>

        {/* Footer de marca comercial (plataforma) */}
        <footer className="mt-10 flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground text-[11px] font-bold tracking-tight">
              {platformInitials}
            </span>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {DEFAULT_BRAND_NAME}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Software de gestión dental · © {year}
          </p>
        </footer>
      </div>

      <aside className="hidden lg:flex relative flex-col overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)/0.1,transparent_55%)]" />

        <div className="relative flex items-center gap-2 p-10">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold tracking-tight">
            {platformInitials}
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {DEFAULT_BRAND_NAME}
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="max-w-md px-10 text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Software para tu clínica
            </p>
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Gestión clínica moderna, sin fricciones.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Agenda, expediente, odontograma, caja y reportes en un solo lugar. Cumple NOM-004,
              NOM-013 y NOM-024 desde el primer paciente.
            </p>
          </div>
        </div>

        <div className="relative p-10 text-center text-xs text-muted-foreground">
          Hecho en México · {DEFAULT_BRAND_NAME}
        </div>
      </aside>
    </div>
  )
}
