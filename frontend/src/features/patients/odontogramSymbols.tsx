import type { WholeToothState } from '@/shared/types/odontogram'

const SLATE = '#334155'
const RED = '#dc2626'

/**
 * Overlay SVG (sin las caras) que representa el estado global del diente.
 * Pensado para un viewBox 0 0 40 40, reutilizado por el diente del
 * odontograma y por las leyendas.
 *
 * Simbología clínica (notación común MX):
 *  - Ausente / extraído  → aspa (X), color neutro.
 *  - Extracción indicada → dos líneas paralelas, color rojo (acción pendiente).
 */
export function WholeStateOverlay({ state }: { state: WholeToothState }) {
  switch (state) {
    case 'absent':
      return (
        <>
          <line x1="6" y1="6" x2="34" y2="34" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="34" y1="6" x2="6" y2="34" stroke={SLATE} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )
    case 'extraction_indicated':
      return (
        <>
          <line x1="7" y1="28" x2="24" y2="7" stroke={RED} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="33" x2="33" y2="12" stroke={RED} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )
    case 'crown':
      return <circle cx="20" cy="20" r="17" fill="none" stroke="#eab308" strokeWidth="2" />
    case 'endodontics':
      return <polygon points="20,8 26,18 14,18" fill="#a855f7" stroke="#581c87" strokeWidth="0.5" />
    case 'implant':
      return (
        <>
          <rect x="17" y="8" width="6" height="6" fill="#475569" />
          <rect x="18" y="14" width="4" height="18" fill="#94a3b8" />
        </>
      )
    case 'fracture':
      return (
        <polyline
          points="6,18 16,22 14,28 24,24 22,32"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
        />
      )
    case 'prosthesis':
      return (
        <rect
          x="6"
          y="6"
          width="28"
          height="28"
          fill="none"
          stroke="#0891b2"
          strokeWidth="2"
          strokeDasharray="3 2"
        />
      )
    default:
      return null
  }
}

/** Glifo independiente (con contorno de diente) para usar en leyendas. */
export function WholeStateGlyph({ state }: { state: WholeToothState }) {
  return (
    <svg viewBox="0 0 40 40" className="size-5 shrink-0" aria-hidden>
      <rect
        x="4"
        y="4"
        width="32"
        height="32"
        rx="3"
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        opacity={state === 'absent' ? 0.4 : 1}
      />
      <WholeStateOverlay state={state} />
    </svg>
  )
}
