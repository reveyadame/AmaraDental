import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  CreditCard,
  FlaskConical,
  Heart,
  Lock,
  Menu,
  Palette,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import { usePublicPlans } from './hooks'
import type { PublicPlan } from './api'
import { AmaraIcon, AmaraWordmark } from './AmaraLogo'
import { formatMXN } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet'

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#precios', label: 'Precios' },
  { href: '#preguntas', label: 'Preguntas' },
]

const FEATURES = [
  { icon: CalendarCheck, title: 'Agenda inteligente', desc: 'Citas por especialista, recordatorios y bloqueos. Adiós a los empalmes y a la libreta.' },
  { icon: ClipboardList, title: 'Expediente clínico', desc: 'Odontograma, historia y consentimientos digitales conforme a la NOM-004.' },
  { icon: Wallet, title: 'Caja y cobros', desc: 'Cortes de caja, pagos parciales, comisiones y estados de cuenta sin hojas de cálculo.' },
  { icon: Bell, title: 'Recalls automáticos', desc: 'Recupera pacientes con recordatorios de revisión y limpieza. Más sillón ocupado.' },
  { icon: FlaskConical, title: 'Laboratorios', desc: 'Órdenes y seguimiento de trabajos de laboratorio, con fechas y estatus claros.' },
  { icon: Smartphone, title: 'App para pacientes', desc: 'Tus pacientes consultan citas y saldos desde su teléfono. Menos llamadas.' },
  { icon: Palette, title: 'Con tu marca', desc: 'Tu logo, tus colores y tu propio subdominio: la plataforma se ve como tu clínica.' },
  { icon: BarChart3, title: 'Reportes y métricas', desc: 'Ingresos, producción por especialista y pendientes, en tableros claros.' },
]

const STEPS = [
  { n: '1', title: 'Crea tu clínica', desc: 'Regístrate en un minuto y elige tu subdominio. Sin instalar nada, sin tarjeta.' },
  { n: '2', title: 'Personaliza', desc: 'Sube tu logo, da de alta especialistas y tratamientos. Lo dejas con la cara de tu clínica.' },
  { n: '3', title: 'Empieza a operar', desc: 'Agenda, cobra y lleva el expediente desde el primer día. Tu equipo entra desde cualquier navegador.' },
]

const TRUST = [
  { icon: Clock, label: '14 días gratis' },
  { icon: CreditCard, label: 'Sin tarjeta para empezar' },
  { icon: ShieldCheck, label: 'Cumple NOM mexicanas' },
  { icon: Heart, label: 'Soporte en español' },
]

const TESTIMONIALS = [
  {
    quote: 'Pasamos de la libreta y Excel a tener todo en un solo lugar. La agenda y la caja nos ahorran horas cada semana.',
    name: 'Dra. Mariana Ruiz',
    role: 'Directora · Clínica Sonrisas',
  },
  {
    quote: 'Los recordatorios automáticos nos recuperaron pacientes que teníamos olvidados. Se nota en la agenda.',
    name: 'Dr. Carlos Méndez',
    role: 'Odontólogo · Dental Norte',
  },
  {
    quote: 'Configurarlo fue rapidísimo y el expediente cumple con la norma. Mi equipo lo aprendió en un día.',
    name: 'Dra. Paola Hernández',
    role: 'Propietaria · Centro Dental Aura',
  },
]

const FAQS = [
  { q: '¿Necesito tarjeta para empezar?', a: 'No. Creas tu clínica y usas Amara Dental gratis por 14 días. Agregas tu método de pago cuando quieras, desde Configuración.' },
  { q: '¿Qué pasa al terminar la prueba?', a: 'Te avisamos antes. Si agregas tu tarjeta, continúas sin interrupción con el plan que elegiste. Si no, tu información se conserva mientras decides.' },
  { q: '¿Puedo cambiar de plan después?', a: 'Sí, puedes subir o bajar de plan en cualquier momento según el crecimiento de tu clínica.' },
  { q: '¿Mis datos están seguros?', a: 'Cada clínica vive aislada en su propio espacio, con bitácora de auditoría y resguardo conforme a las normas mexicanas de salud (NOM-004, NOM-024).' },
  { q: '¿Sirve para varios consultorios y especialistas?', a: 'Sí. La agenda, la caja y el expediente están pensados para operar con varios especialistas y usuarios a la vez.' },
  { q: '¿Necesito instalar algo?', a: 'No. Amara Dental funciona en el navegador. Tu equipo entra desde cualquier computadora; tus pacientes, desde su teléfono.' },
]

function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="Amara Dental">
          <AmaraWordmark iconClassName="size-8" />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-brand-navy">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
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
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-5">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-brand-navy">
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

function PreviewCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-brand-teal/20 blur-2xl" />
      <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-navy">Agenda de hoy</p>
            <span className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-xs font-medium text-brand-teal">8 citas</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { h: '09:00', n: 'Limpieza · Ana P.', c: 'bg-brand-teal' },
              { h: '10:30', n: 'Endodoncia · Luis M.', c: 'bg-brand-navy' },
              { h: '12:00', n: 'Control · Sofía R.', c: 'bg-brand-teal-light' },
            ].map((r) => (
              <div key={r.h} className="flex items-center gap-3 rounded-lg border border-border/70 p-2">
                <span className={`h-8 w-1 rounded-full ${r.c}`} />
                <span className="w-12 text-xs font-medium text-muted-foreground">{r.h}</span>
                <span className="text-sm text-brand-navy">{r.n}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/60 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ingresos hoy</p>
              <p className="text-base font-bold text-brand-navy">$12,450</p>
            </div>
            <div className="rounded-lg bg-muted/60 p-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Por cobrar</p>
              <p className="text-base font-bold text-brand-navy">$3,200</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy to-brand-navy-deep text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-brand-teal/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full bg-brand-teal/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-brand-teal-light">
            <Star className="size-3.5 fill-brand-teal-light text-brand-teal-light" /> Software dental hecho en México
          </span>
          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            La gestión de tu clínica dental, <span className="text-brand-teal-light">simple y en orden</span>
          </h1>
          <p className="mt-5 max-w-xl text-balance text-lg text-white/80">
            Agenda, expediente clínico, caja y pacientes en una sola plataforma con tu marca. Menos
            papeleo, más sonrisas. Empieza gratis 14 días, sin tarjeta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="shadow-lg shadow-brand-teal/20">
              <Link to="/registro">
                Comenzar gratis <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href="#precios">Ver precios</a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST.map((t) => (
              <span key={t.label} className="flex items-center gap-1.5 text-sm text-white/70">
                <t.icon className="size-4 text-brand-teal-light" /> {t.label}
              </span>
            ))}
          </div>
        </div>
        <div className="lg:pl-6">
          <PreviewCard />
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="caracteristicas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">Todo en un lugar</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          Lo que tu clínica necesita, sin complicaciones
        </h2>
        <p className="mt-4 text-muted-foreground">
          Reúne en una sola plataforma lo que hoy tienes disperso en papel, hojas de cálculo y apps sueltas.
        </p>
      </div>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="group rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal transition-colors group-hover:bg-brand-teal group-hover:text-white">
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold text-brand-navy">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">En 3 pasos</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            De cero a operando en minutos
          </h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="relative rounded-2xl border bg-card p-7">
              <span className="grid size-11 place-items-center rounded-full bg-brand-navy text-lg font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlanCard({ plan, featured }: { plan: PublicPlan; featured: boolean }) {
  const limit =
    plan.max_patients === null
      ? 'Pacientes ilimitados'
      : `Hasta ${plan.max_patients.toLocaleString('es-MX')} pacientes`
  const perks = [
    'Agenda, citas y recordatorios',
    'Expediente clínico (NOM-004)',
    'Caja, cobros y comisiones',
    limit,
    plan.includes_app ? 'App para pacientes incluida' : 'Recalls y laboratorios',
    'Tu marca y subdominio propio',
  ]
  return (
    <div
      className={
        featured
          ? 'relative rounded-3xl border-2 border-brand-teal bg-card p-7 shadow-xl shadow-brand-teal/10'
          : 'relative rounded-3xl border bg-card p-7'
      }
    >
      {featured ? (
        <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-teal px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="size-3.5" /> Más popular
        </span>
      ) : null}
      <h3 className="text-lg font-semibold text-brand-navy">{plan.name}</h3>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-extrabold tracking-tight text-brand-navy">
          {plan.price_mxn !== null ? formatMXN(plan.price_mxn) : '—'}
        </span>
        <span className="pb-1.5 text-sm text-muted-foreground">/mes</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">14 días gratis · sin tarjeta</p>
      <Button asChild className="mt-6 w-full" variant={featured ? 'default' : 'outline'}>
        <Link to={`/registro?plan=${plan.key}`}>Comenzar gratis</Link>
      </Button>
      <ul className="mt-7 space-y-3">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-brand-navy/90">
            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-brand-teal/15 text-brand-teal">
              <Check className="size-3" />
            </span>
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
    <section id="precios" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-teal">Precios</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          Un plan para cada etapa de tu clínica
        </h2>
        <p className="mt-4 text-muted-foreground">
          Sin contratos forzosos. Cambias o cancelas cuando quieras. Todos incluyen 14 días gratis.
        </p>
      </div>
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {plans.data?.map((p) => (
          <PlanCard key={p.key} plan={p} featured={p.key === 'crecimiento'} />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Tienes una clínica grande o varios consultorios? <a href="#contacto" className="font-medium text-brand-teal hover:underline">Hablemos</a>.
      </p>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
            Clínicas que ya trabajan mejor
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border bg-card p-6">
              <div className="flex gap-0.5 text-brand-teal">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-brand-teal" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm text-brand-navy/90">“{t.quote}”</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-semibold text-brand-navy">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Compliance() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <div className="grid items-center gap-10 rounded-3xl border bg-brand-navy p-8 text-white sm:p-12 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-teal-light">
            <Lock className="size-3.5" /> Seguridad y normativa
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Tus datos, protegidos y en regla</h2>
          <p className="mt-3 text-white/75">
            Amara Dental nace cumpliendo las normas oficiales mexicanas de salud. Cada clínica vive
            aislada, con bitácora de auditoría y respaldo de su información.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            'NOM-004: expediente clínico',
            'NOM-024: sistemas de salud',
            'NOM-013: salud bucal',
            'Bitácora de auditoría',
            'Aislamiento por clínica',
            'Respaldo de tu información',
          ].map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm text-white/90">
              <ShieldCheck className="size-4 shrink-0 text-brand-teal-light" /> {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section id="preguntas" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
      <h2 className="text-center text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
        Preguntas frecuentes
      </h2>
      <div className="mt-12 divide-y rounded-2xl border bg-card">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-5">
            <summary className="flex cursor-pointer items-center justify-between font-medium text-brand-navy [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="ml-4 text-xl leading-none text-brand-teal transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section id="contacto" className="relative overflow-hidden bg-gradient-to-br from-brand-teal to-brand-teal-dark text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <AmaraIcon className="mx-auto size-12 text-white" />
        <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Empieza hoy, sin tarjeta
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Crea tu clínica en menos de un minuto y prueba todo gratis por 14 días. Cuando estés
          listo, eliges tu plan.
        </p>
        <Button size="lg" variant="secondary" asChild className="mt-8 text-brand-navy">
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
    <footer className="bg-brand-navy-deep text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <AmaraWordmark tone="light" iconClassName="size-9" />
            <p className="mt-4 max-w-sm text-sm text-white/60">
              Software de gestión para clínicas dentales en México. Agenda, expediente, caja y
              pacientes en un solo lugar, con tu marca.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Producto</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#caracteristicas" className="hover:text-white">Características</a></li>
              <li><a href="#precios" className="hover:text-white">Precios</a></li>
              <li><a href="#preguntas" className="hover:text-white">Preguntas</a></li>
              <li><Link to="/registro" className="hover:text-white">Crear cuenta</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Cumplimiento</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>NOM-004-SSA3</li>
              <li>NOM-024-SSA3</li>
              <li>NOM-013-SSA2</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} Amara Dental. Todos los derechos reservados.</p>
          <p>Hecho con cuidado en México 🇲🇽</p>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="amara-brand min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Compliance />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
