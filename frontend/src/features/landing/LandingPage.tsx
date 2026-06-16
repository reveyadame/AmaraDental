import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  Check,
  FileText,
  FlaskConical,
  Menu,
  Palette,
  ShieldCheck,
  Smartphone,
  Star,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { usePublicPlans } from './hooks'
import type { PublicPlan } from './api'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { formatMXN } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet'

const FEATURES = [
  { icon: Calendar, title: 'Agenda inteligente', desc: 'Citas, recordatorios y bloqueos por especialista, sin empalmes.' },
  { icon: FileText, title: 'Expediente clínico', desc: 'Odontograma, historia y consentimientos conforme a la NOM-004.' },
  { icon: Wallet, title: 'Caja y cobros', desc: 'Cortes, pagos parciales, comisiones y estados de cuenta.' },
  { icon: Bell, title: 'Recalls y seguimiento', desc: 'Recupera pacientes con recordatorios de revisión automáticos.' },
  { icon: FlaskConical, title: 'Laboratorios', desc: 'Órdenes y seguimiento de trabajos de laboratorio dental.' },
  { icon: Smartphone, title: 'App para pacientes', desc: 'Tus pacientes consultan citas y saldos desde su teléfono.' },
  { icon: Palette, title: 'Tu marca', desc: 'Logo, colores y subdominio propio: la clínica se ve tuya.' },
  { icon: ShieldCheck, title: 'Cumple normativa', desc: 'Bitácora y resguardo conforme a las NOM mexicanas de salud.' },
]

const FAQS = [
  {
    q: '¿Necesito tarjeta para empezar?',
    a: 'No. Creas tu clínica y usas Amara Dental gratis por 14 días. Agregas tu método de pago cuando quieras, desde Configuración.',
  },
  {
    q: '¿Qué pasa al terminar la prueba?',
    a: 'Te avisamos antes. Si agregas tu tarjeta, continúas sin interrupción con el plan que elegiste. Si no, tu información se conserva mientras decides.',
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Sí, puedes subir o bajar de plan en cualquier momento según el crecimiento de tu clínica.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada clínica vive aislada en su propio espacio, con bitácora de auditoría y resguardo conforme a las normas mexicanas de salud (NOM-004, NOM-024).',
  },
  {
    q: '¿Sirve para varios consultorios?',
    a: 'Sí. La agenda, la caja y el expediente están pensados para operar tu consultorio con varios especialistas y usuarios.',
  },
]

function Header() {
  const [open, setOpen] = useState(false)
  const links = [
    { href: '#caracteristicas', label: 'Características' },
    { href: '#precios', label: 'Precios' },
    { href: '#preguntas', label: 'Preguntas' },
  ]
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            AD
          </span>
          <span className="text-base font-semibold">{DEFAULT_BRAND_NAME}</span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild>
            <Link to="/registro">Prueba gratis</Link>
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="md:hidden">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="mt-8 flex flex-col gap-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
              <Button asChild className="mt-2">
                <Link to="/registro">Prueba gratis</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          <Star className="size-3.5 text-amber-500" /> Software dental hecho en México
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          La gestión de tu clínica dental, simple y en orden
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Agenda, expediente clínico, caja y pacientes en un solo lugar. Empieza gratis 14 días, sin
          tarjeta.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link to="/registro">
              Comenzar gratis <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#precios">Ver precios</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          14 días gratis · Sin tarjeta · Cancela cuando quieras
        </p>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="caracteristicas" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">Todo lo que tu clínica necesita</h2>
        <p className="mt-3 text-muted-foreground">
          Reúne en una sola plataforma lo que hoy tienes disperso en papel, hojas de cálculo y apps.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function PlanCard({ plan, featured }: { plan: PublicPlan; featured: boolean }) {
  const limit =
    plan.max_patients === null ? 'Pacientes ilimitados' : `Hasta ${plan.max_patients.toLocaleString('es-MX')} pacientes`
  const perks = [
    'Agenda y citas',
    'Expediente clínico (NOM-004)',
    'Caja, cobros y comisiones',
    limit,
    plan.includes_app ? 'App para pacientes incluida' : 'Recalls y laboratorios',
  ]
  return (
    <div
      className={
        featured
          ? 'relative rounded-2xl border-2 border-primary bg-card p-6 shadow-lg'
          : 'relative rounded-2xl border bg-card p-6'
      }
    >
      {featured ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Más popular
        </span>
      ) : null}
      <h3 className="text-lg font-semibold">{plan.name}</h3>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-bold tracking-tight">
          {plan.price_mxn !== null ? formatMXN(plan.price_mxn) : '—'}
        </span>
        <span className="pb-1 text-sm text-muted-foreground">/mes</span>
      </div>
      <Button asChild className="mt-5 w-full" variant={featured ? 'default' : 'outline'}>
        <Link to={`/registro?plan=${plan.key}`}>Comenzar gratis</Link>
      </Button>
      <ul className="mt-6 space-y-2.5">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Pricing() {
  const plans = usePublicPlans()
  return (
    <section id="precios" className="border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Precios claros, sin sorpresas</h2>
          <p className="mt-3 text-muted-foreground">
            Elige el plan según el tamaño de tu clínica. Todos incluyen 14 días gratis.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.data?.map((p) => (
            <PlanCard key={p.key} plan={p} featured={p.key === 'crecimiento'} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="preguntas" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <h2 className="text-center text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
      <div className="mt-10 divide-y rounded-2xl border bg-card">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="ml-4 text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function CtaBand() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">Empieza hoy, sin tarjeta</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
          Crea tu clínica en menos de un minuto y prueba todo gratis por 14 días.
        </p>
        <Button size="lg" variant="secondary" asChild className="mt-7">
          <Link to="/registro">
            Crear mi clínica <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Building2 className="size-4" />
          <span>
            © {DEFAULT_BRAND_NAME} · Software de gestión dental
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#precios" className="hover:text-foreground">Precios</a>
          <a href="#preguntas" className="hover:text-foreground">Preguntas</a>
          <Link to="/registro" className="hover:text-foreground">Crear cuenta</Link>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </div>
  )
}
