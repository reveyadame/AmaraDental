import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useUpdateTooth } from './useOdontogram'
import {
  FACE_LABELS,
  FACE_STATE_COLORS,
  FACE_STATE_LABELS,
  WHOLE_STATE_LABELS,
  type FaceKey,
  type FaceState,
  type ToothState,
  type WholeToothState,
} from '@/shared/types/odontogram'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Separator } from '@/shared/ui/separator'
import { cn } from '@/shared/lib/utils'

const FACE_STATES: FaceState[] = ['healthy', 'caries', 'restored', 'sealant', 'defective']
const WHOLE_STATES: WholeToothState[] = [
  'absent',
  'crown',
  'endodontics',
  'implant',
  'fracture',
  'extraction_indicated',
  'prosthesis',
]

interface Props {
  patientId: number
  tooth: ToothState
  readOnly?: boolean
  onClose?: () => void
}

export function ToothEditor({ patientId, tooth, readOnly, onClose }: Props) {
  const mutation = useUpdateTooth(patientId)
  const [faces, setFaces] = useState<Record<FaceKey, FaceState>>(tooth.faces)
  const [whole, setWhole] = useState<WholeToothState | null>(tooth.whole_state)
  const [notes, setNotes] = useState<string>(tooth.notes ?? '')

  useEffect(() => {
    setFaces(tooth.faces)
    setWhole(tooth.whole_state)
    setNotes(tooth.notes ?? '')
  }, [tooth])

  const dirty =
    JSON.stringify(faces) !== JSON.stringify(tooth.faces) ||
    whole !== tooth.whole_state ||
    (notes || '') !== (tooth.notes ?? '')

  const onSave = () => {
    mutation.mutate(
      {
        toothNumber: tooth.tooth_number,
        payload: {
          faces,
          whole_state: whole,
          notes: notes || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Diente ${tooth.tooth_number} actualizado`)
        },
        onError: () => toast.error('No fue posible guardar'),
      },
    )
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Diente {tooth.tooth_number}</CardTitle>
          {tooth.updated_at ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              Última edición: {new Date(tooth.updated_at).toLocaleString('es-MX')}{' '}
              · {tooth.updated_by_name ?? '—'}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Sin cambios registrados.</p>
          )}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 -mr-1"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-2">
          <Label className="text-xs">Estado por cara</Label>
          <div className="space-y-2">
            {(Object.keys(FACE_LABELS) as FaceKey[]).map((k) => (
              <div key={k} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs text-muted-foreground sm:w-32 shrink-0">
                  {FACE_LABELS[k]}
                </span>
                <div className="flex flex-wrap gap-1">
                  {FACE_STATES.map((s) => {
                    const active = faces[k] === s
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={readOnly}
                        onClick={() => setFaces({ ...faces, [k]: s })}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                          active
                            ? 'border-foreground/40 bg-foreground/5 font-medium'
                            : 'border-input text-muted-foreground hover:bg-accent',
                          readOnly && 'cursor-not-allowed opacity-60',
                        )}
                      >
                        <span
                          className="size-3 rounded-full border"
                          style={{ background: FACE_STATE_COLORS[s] }}
                        />
                        {FACE_STATE_LABELS[s]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section className="space-y-2">
          <Label className="text-xs">Estado global del diente</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setWhole(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                whole === null
                  ? 'border-foreground/40 bg-foreground/5 font-medium'
                  : 'border-input text-muted-foreground hover:bg-accent',
                readOnly && 'cursor-not-allowed opacity-60',
              )}
            >
              Ninguno
            </button>
            {WHOLE_STATES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={readOnly}
                onClick={() => setWhole(s)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  whole === s
                    ? 'border-foreground/40 bg-foreground/5 font-medium'
                    : 'border-input text-muted-foreground hover:bg-accent',
                  readOnly && 'cursor-not-allowed opacity-60',
                )}
              >
                {WHOLE_STATE_LABELS[s]}
              </button>
            ))}
          </div>
        </section>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor={`notes-${tooth.tooth_number}`} className="text-xs">
            Notas del diente
          </Label>
          <Textarea
            id={`notes-${tooth.tooth_number}`}
            rows={3}
            value={notes}
            disabled={readOnly}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones clínicas…"
          />
        </div>

        {!readOnly ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFaces(tooth.faces)
                setWhole(tooth.whole_state)
                setNotes(tooth.notes ?? '')
              }}
              disabled={!dirty || mutation.isPending}
            >
              Descartar
            </Button>
            <Button onClick={onSave} disabled={!dirty || mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Guardar diente
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
