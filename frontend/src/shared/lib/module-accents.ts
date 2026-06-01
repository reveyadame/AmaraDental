/**
 * Paleta de acentos por módulo. Cada módulo tiene su tono identificador
 * (icono en círculo, badge, hover) para que la app no se vea monótona.
 * Las clases están escritas completas para que Tailwind las purgue bien.
 */
export type ModuleAccent = {
  /** Fondo + texto del icono en círculo del header. */
  badge: string
  /** Color de texto plano (para títulos de sección). */
  text: string
  /** Color de barra/borde decorativo. */
  border: string
  /** Background suave para fondos sutiles. */
  soft: string
}

export const MODULE_ACCENTS: Record<string, ModuleAccent> = {
  dashboard: {
    badge: 'bg-primary/10 text-primary',
    text: 'text-primary',
    border: 'border-primary',
    soft: 'bg-primary/5',
  },
  patients: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500',
    soft: 'bg-sky-50 dark:bg-sky-950/20',
  },
  agenda: {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-500',
    soft: 'bg-violet-50 dark:bg-violet-950/20',
  },
  treatments: {
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500',
    soft: 'bg-teal-50 dark:bg-teal-950/20',
  },
  specialists: {
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500',
    soft: 'bg-indigo-50 dark:bg-indigo-950/20',
  },
  cash: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500',
    soft: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  quotes: {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-300',
    text: 'text-lime-800 dark:text-lime-300',
    border: 'border-lime-500',
    soft: 'bg-lime-50 dark:bg-lime-950/20',
  },
  prescriptions: {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500',
    soft: 'bg-rose-50 dark:bg-rose-950/20',
  },
  labs: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500',
    soft: 'bg-amber-50 dark:bg-amber-950/20',
  },
  memberships: {
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    border: 'border-fuchsia-500',
    soft: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
  },
  recalls: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500',
    soft: 'bg-orange-50 dark:bg-orange-950/20',
  },
  reports: {
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500',
    soft: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
  audit: {
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    text: 'text-slate-700 dark:text-slate-200',
    border: 'border-slate-500',
    soft: 'bg-slate-50 dark:bg-slate-900/40',
  },
  users: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500',
    soft: 'bg-blue-50 dark:bg-blue-950/20',
  },
  configuration: {
    badge: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    text: 'text-zinc-700 dark:text-zinc-200',
    border: 'border-zinc-500',
    soft: 'bg-zinc-50 dark:bg-zinc-900/40',
  },
}

export function accent(module: keyof typeof MODULE_ACCENTS): ModuleAccent {
  const found = MODULE_ACCENTS[module]
  return found ?? (MODULE_ACCENTS.dashboard as ModuleAccent)
}
