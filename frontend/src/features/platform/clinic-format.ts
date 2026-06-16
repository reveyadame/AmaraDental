/** Helpers de formato para el panel de plataforma (fechas, antigüedad). */

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Antigüedad relativa, ej. "hace 3 meses". */
export function relativeFrom(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const days = Math.floor((Date.now() - then) / 86_400_000)
  const rtf = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })
  if (days < 1) return 'hoy'
  if (days < 30) return rtf.format(-days, 'day')
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month')
  return rtf.format(-Math.floor(days / 365), 'year')
}
