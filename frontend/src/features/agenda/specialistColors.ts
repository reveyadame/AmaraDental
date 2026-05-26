/**
 * Paleta estable para distinguir citas/bloqueos por dentista cuando la
 * agenda muestra a todos. El mismo id siempre cae en el mismo color.
 *
 * Devuelve clases Tailwind precompiladas para que el JIT las purgue
 * correctamente — por eso son strings literales y no se generan dinámicamente.
 */
export interface SpecialistColor {
  /** Borde izquierdo (banda gruesa identificadora). */
  leftBorder: string
  /** Color del punto/chip de leyenda. */
  dot: string
  /** Color de texto (para la chip de leyenda). */
  text: string
}

const PALETTE: SpecialistColor[] = [
  { leftBorder: 'border-l-sky-500', dot: 'bg-sky-500', text: 'text-sky-700' },
  { leftBorder: 'border-l-violet-500', dot: 'bg-violet-500', text: 'text-violet-700' },
  { leftBorder: 'border-l-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  { leftBorder: 'border-l-amber-500', dot: 'bg-amber-500', text: 'text-amber-700' },
  { leftBorder: 'border-l-rose-500', dot: 'bg-rose-500', text: 'text-rose-700' },
  { leftBorder: 'border-l-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-700' },
  { leftBorder: 'border-l-fuchsia-500', dot: 'bg-fuchsia-500', text: 'text-fuchsia-700' },
  { leftBorder: 'border-l-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  { leftBorder: 'border-l-teal-500', dot: 'bg-teal-500', text: 'text-teal-700' },
  { leftBorder: 'border-l-orange-500', dot: 'bg-orange-500', text: 'text-orange-700' },
]

export function colorForSpecialist(id: number | null | undefined): SpecialistColor {
  if (!id) return PALETTE[0] as SpecialistColor
  return PALETTE[id % PALETTE.length] as SpecialistColor
}
