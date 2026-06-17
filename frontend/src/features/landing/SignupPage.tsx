import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { usePublicPlans, useDebouncedValue, useSignup, useSlugCheck } from './hooks'
import type { SignupResult } from './api'
import { AmaraLogoVertical, AmaraWordmark } from './AmaraLogo'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { formatMXN } from '@/shared/lib/utils'
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

const CENTRAL = (import.meta.env.VITE_CENTRAL_DOMAIN as string | undefined) ?? 'amaradental.mx'

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')

const SIDE_POINTS = [
  { icon: Clock, text: '14 días gratis, sin compromiso' },
  { icon: CreditCard, text: 'Sin tarjeta para empezar' },
  { icon: ShieldCheck, text: 'Cumple las NOM mexicanas de salud' },
]

function BrandPanel() {
  return (
    <div className="animate-slide-in-left relative hidden overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-deep p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-brand-teal/20 blur-3xl" />
      <Link to="/" className="relative">
        <AmaraWordmark tone="light" iconClassName="size-9" />
      </Link>
      <div className="relative">
        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          Tu clínica, más ordenada desde el primer día.
        </h2>
        <ul className="mt-8 space-y-4">
          {SIDE_POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-brand-teal-light">
                <p.icon className="size-5" />
              </span>
              <span className="text-white/85">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <figure className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
        <blockquote className="text-sm text-white/85">
          “Configurarlo fue rapidísimo y mi equipo lo aprendió en un día.”
        </blockquote>
        <figcaption className="mt-2 text-xs text-white/60">
          Dra. Paola Hernández · Centro Dental Aura
        </figcaption>
      </figure>
    </div>
  )
}

function SuccessScreen({ result }: { result: SignupResult }) {
  return (
    <div className="amara-brand grid min-h-screen place-items-center bg-muted/40 px-4 py-12">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-brand-navy">¡Tu clínica está lista!</h1>
        <p className="mt-2 text-muted-foreground">
          Tu espacio en{' '}
          <strong className="text-brand-navy">
            {result.slug}.{CENTRAL}
          </strong>{' '}
          ya está activo con 14 días gratis.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border bg-muted/50 p-3 text-sm">
          <MailCheck className="size-4 text-emerald-600" />
          Te enviamos tus credenciales a <strong>{result.admin_email}</strong>
        </div>
        <Button size="lg" asChild className="mt-6 w-full">
          <a href={result.app_url}>
            Ir a mi clínica <ArrowRight className="size-4" />
          </a>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Revisa tu correo (incluida la carpeta de spam) para tu usuario y contraseña.
        </p>
      </div>
    </div>
  )
}

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const plans = usePublicPlans()
  const signup = useSignup()

  const [clinicName, setClinicName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [slug, setSlug] = useState('')
  const [planKey, setPlanKey] = useState(searchParams.get('plan') ?? 'esencial')
  const [result, setResult] = useState<SignupResult | null>(null)

  const debouncedSlug = useDebouncedValue(slug, 400)
  const slugCheck = useSlugCheck(debouncedSlug)
  const slugUpToDate = debouncedSlug === slug
  const slugAvailable = slugUpToDate && slugCheck.data?.available === true

  const canSubmit =
    clinicName.trim().length > 1 &&
    /.+@.+\..+/.test(adminEmail) &&
    slug.length >= 3 &&
    slugAvailable &&
    !signup.isPending

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    signup.mutate(
      {
        clinic_name: clinicName.trim(),
        admin_name: adminName.trim() || undefined,
        admin_email: adminEmail.trim(),
        slug,
        plan_key: planKey,
      },
      { onSuccess: setResult },
    )
  }

  if (result) return <SuccessScreen result={result} />

  return (
    <div className="amara-brand min-h-screen lg:grid lg:grid-cols-2">
      <BrandPanel />

      <div className="flex min-h-screen flex-col bg-background px-4 py-8 sm:px-8">
        <div
          className="animate-fade-up mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6"
          style={{ animationDelay: '120ms' }}
        >
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand-navy"
          >
            <ArrowLeft className="size-4" /> Volver al inicio
          </Link>

          <div className="lg:hidden">
            <AmaraLogoVertical iconClassName="size-12" className="mx-auto" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-brand-navy lg:mt-0">
            Crea tu clínica
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-brand-teal" /> 14 días gratis · sin tarjeta · listo en un minuto
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clinic">Nombre de la clínica</Label>
              <Input
                id="clinic"
                value={clinicName}
                onChange={(e) => {
                  setClinicName(e.target.value)
                  if (slug === '') setSlug(slugify(e.target.value))
                }}
                placeholder="Sonrisas Felices"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Tu dirección web</Label>
              <div className="flex items-center overflow-hidden rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                <input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="sonrisas"
                  className="w-full bg-transparent px-3 py-2 text-sm outline-none"
                  autoComplete="off"
                />
                <span className="whitespace-nowrap bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  .{CENTRAL}
                </span>
              </div>
              <SlugHint
                slug={slug}
                upToDate={slugUpToDate}
                checking={slugCheck.isFetching}
                available={slugCheck.data?.available}
                reason={slugCheck.data?.reason ?? null}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Tu correo</Label>
              <Input
                id="email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
              <p className="text-xs text-muted-foreground">Ahí te enviamos tus credenciales de acceso.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adminName">Tu nombre (opcional)</Label>
              <Input
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Dr. Juan Pérez"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={planKey} onValueChange={setPlanKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.data?.map((p) => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.name}
                      {p.price_mxn !== null ? ` — ${formatMXN(p.price_mxn)}/mes` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Puedes cambiarlo cuando quieras. No se cobra durante la prueba.
              </p>
            </div>

            {signup.isError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getApiErrorMessage(signup.error, 'No fue posible crear tu clínica. Intenta de nuevo.')}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {signup.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Crear mi clínica gratis
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al crear tu cuenta aceptas operar conforme a las normas aplicables de tu clínica.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

function SlugHint({
  slug,
  upToDate,
  checking,
  available,
  reason,
}: {
  slug: string
  upToDate: boolean
  checking: boolean
  available?: boolean
  reason: string | null
}) {
  if (slug.length < 3) {
    return <p className="text-xs text-muted-foreground">Al menos 3 caracteres (letras, números o guiones).</p>
  }
  if (!upToDate || checking) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Verificando disponibilidad…
      </p>
    )
  }
  if (available) {
    return (
      <p className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="size-3" /> ¡Disponible!
      </p>
    )
  }
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <X className="size-3" /> {reason ?? 'No disponible'}
    </p>
  )
}
