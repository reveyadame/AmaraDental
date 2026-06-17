import { cn } from '@/shared/lib/utils'

/**
 * Isotipo Amara Dental: la "A" con el diente en negativo y el punto.
 * Vectorial (nítido a cualquier tamaño). El color se controla con `text-*`
 * (la "A" usa currentColor); el punto va en teal claro para contraste.
 */
export function AmaraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {/* "A" (triángulo redondeado) con el diente recortado (evenodd = hueco) */}
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M56.04 20.09 Q60 12 63.96 20.09 L102.04 97.91 Q106 106 97 106 L23 106 Q14 106 17.96 97.91 Z
           M48 62 C48 53 52 49 56 50 C58 50.5 59 52.5 60 52.5 C61 52.5 62 50.5 64 50 C68 49 72 53 72 62
           C72 72 69 80 67 96 C66.6 100 66 104 64.5 104 C63.2 104 62.6 99 62 94 C61.4 89 58.6 89 58 94
           C57.4 99 56.8 104 55.5 104 C54 104 53.4 100 53 96 C51 80 48 72 48 62 Z"
      />
      {/* Punto dentro del diente */}
      <ellipse cx="60" cy="80" rx="4.2" ry="5.4" className="fill-brand-teal-light" />
    </svg>
  )
}

/**
 * Imagotipo horizontal: isotipo + "amara DENTAL".
 * `tone="light"` para fondos oscuros (texto claro).
 */
export function AmaraWordmark({
  className,
  iconClassName,
  tone = 'color',
}: {
  className?: string
  iconClassName?: string
  tone?: 'color' | 'light'
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <AmaraIcon className={cn('text-brand-teal', iconClassName ?? 'size-8')} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-[1.35em] font-extrabold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-brand-navy',
          )}
        >
          amara
        </span>
        <span
          className={cn(
            'text-[0.62em] font-semibold uppercase tracking-[0.35em]',
            tone === 'light' ? 'text-brand-teal-light' : 'text-brand-teal',
          )}
        >
          dental
        </span>
      </span>
    </span>
  )
}

/** Imagotipo vertical (isotipo arriba, texto abajo). Para hero / paneles. */
export function AmaraLogoVertical({
  className,
  iconClassName,
  tone = 'color',
}: {
  className?: string
  iconClassName?: string
  tone?: 'color' | 'light'
}) {
  return (
    <span className={cn('inline-flex flex-col items-center gap-3', className)}>
      <AmaraIcon className={cn('text-brand-teal', iconClassName ?? 'size-16')} />
      <span className="flex flex-col items-center leading-none">
        <span
          className={cn(
            'text-3xl font-extrabold tracking-tight',
            tone === 'light' ? 'text-white' : 'text-brand-navy',
          )}
        >
          amara
        </span>
        <span
          className={cn(
            'text-sm font-semibold uppercase tracking-[0.4em]',
            tone === 'light' ? 'text-brand-teal-light' : 'text-brand-teal',
          )}
        >
          dental
        </span>
      </span>
    </span>
  )
}
