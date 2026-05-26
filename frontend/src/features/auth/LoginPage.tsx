import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { useBranding, useLogin, useMe } from './hooks'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

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

  const onSubmit = (values: LoginForm) =>
    loginMutation.mutate(values, {
      onError: (error: unknown) => {
        const data =
          error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })
                .response?.data
            : undefined
        const emailError =
          data?.errors?.email?.[0] ?? data?.message ?? 'No fue posible iniciar sesión'
        setError('email', { type: 'server', message: emailError })
      },
    })

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-sm border-none shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-2">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-10 w-auto" />
            ) : (
              <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                {(branding?.brand_name ?? 'CD').slice(0, 2).toUpperCase()}
              </div>
            )}
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión en {branding?.brand_name ?? 'CIO Dent'} para continuar.
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
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
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

      <aside className="hidden lg:flex relative items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)/0.1,transparent_55%)]" />
        <div className="relative max-w-md px-10 text-center space-y-4">
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
      </aside>
    </div>
  )
}
