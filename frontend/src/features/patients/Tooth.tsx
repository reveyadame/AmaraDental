import { cn } from '@/shared/lib/utils'
import {
  FACE_STATE_COLORS,
  type FaceKey,
  type ToothState,
} from '@/shared/types/odontogram'

interface Props {
  tooth: ToothState
  selected?: boolean
  onSelect?: () => void
}

/**
 * SVG cuadrado con 5 polígonos clickables: vestibular (arriba), mesial
 * (izq./derecha según cuadrante), distal (opuesto), lingual (abajo) y
 * oclusal/incisal (centro).
 *
 * El estado global del diente (`whole_state`) se dibuja como overlay
 * encima de las caras para que el clínico identifique de un vistazo
 * dientes ausentes, con corona, endodoncia, implante, etc.
 */
export function Tooth({ tooth, selected, onSelect }: Props) {
  const faces = tooth.faces
  const whole = tooth.whole_state

  // En la arcada visual, mesial siempre apunta a la línea media.
  // 11-18 y 41-48: cuadrante derecho del paciente → mesial = izquierda del SVG.
  // 21-28 y 31-38: cuadrante izquierdo del paciente → mesial = derecha del SVG.
  const isRightQuadrant =
    (tooth.tooth_number >= 11 && tooth.tooth_number <= 18) ||
    (tooth.tooth_number >= 41 && tooth.tooth_number <= 48)
  const mesialOnLeft = isRightQuadrant

  const mesialPos: 'left' | 'right' = mesialOnLeft ? 'left' : 'right'
  const distalPos: 'left' | 'right' = mesialOnLeft ? 'right' : 'left'

  const colorFor = (k: FaceKey) => FACE_STATE_COLORS[faces[k] ?? 'healthy']

  // Polígonos del diente (square 40x40 con 5 zonas trapezoidales).
  const top = '4,4 36,4 28,12 12,12'
  const bottom = '4,36 36,36 28,28 12,28'
  const left = '4,4 12,12 12,28 4,36'
  const right = '36,4 28,12 28,28 36,36'
  const center = '12,12 28,12 28,28 12,28'

  const facePaths: {
    key: FaceKey
    points: string
  }[] = [
    { key: 'vestibular', points: top },
    { key: 'lingual', points: bottom },
    { key: mesialPos === 'left' ? 'mesial' : 'distal', points: left },
    { key: distalPos === 'left' ? 'mesial' : 'distal', points: right },
    { key: 'oclusal', points: center },
  ]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col items-center gap-0.5 rounded-md p-1 transition-colors',
        selected ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-accent',
      )}
      title={`Diente ${tooth.tooth_number}`}
    >
      <span className="text-[10px] text-muted-foreground font-mono">
        {tooth.tooth_number}
      </span>
      <svg
        viewBox="0 0 40 40"
        className="size-10 sm:size-11"
        aria-label={`Diente ${tooth.tooth_number}`}
      >
        {facePaths.map((f) => (
          <polygon
            key={f.key}
            points={f.points}
            fill={colorFor(f.key)}
            stroke="#1f2937"
            strokeWidth="0.5"
          />
        ))}

        {whole === 'absent' || whole === 'extraction_indicated' ? (
          <>
            <line x1="6" y1="6" x2="34" y2="34" stroke="#dc2626" strokeWidth="2.5" />
            <line x1="34" y1="6" x2="6" y2="34" stroke="#dc2626" strokeWidth="2.5" />
          </>
        ) : null}

        {whole === 'crown' ? (
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="#eab308"
            strokeWidth="2"
          />
        ) : null}

        {whole === 'endodontics' ? (
          <polygon
            points="20,8 26,18 14,18"
            fill="#a855f7"
            stroke="#581c87"
            strokeWidth="0.5"
          />
        ) : null}

        {whole === 'implant' ? (
          <>
            <rect x="17" y="8" width="6" height="6" fill="#475569" />
            <rect x="18" y="14" width="4" height="18" fill="#94a3b8" />
          </>
        ) : null}

        {whole === 'fracture' ? (
          <polyline
            points="6,18 16,22 14,28 24,24 22,32"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
          />
        ) : null}

        {whole === 'prosthesis' ? (
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
        ) : null}
      </svg>
    </button>
  )
}
