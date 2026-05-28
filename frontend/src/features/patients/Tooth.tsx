import { cn } from '@/shared/lib/utils'
import {
  FACE_STATE_COLORS,
  type FaceKey,
  type ToothState,
} from '@/shared/types/odontogram'
import { WholeStateOverlay } from './odontogramSymbols'

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
        {/* Las caras se atenúan cuando el diente está ausente. */}
        <g opacity={whole === 'absent' ? 0.4 : 1}>
          {facePaths.map((f) => (
            <polygon
              key={f.key}
              points={f.points}
              fill={colorFor(f.key)}
              stroke="#1f2937"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {whole ? <WholeStateOverlay state={whole} /> : null}
      </svg>
    </button>
  )
}
