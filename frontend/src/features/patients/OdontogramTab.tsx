import { useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { useOdontogram } from './useOdontogram'
import { Tooth } from './Tooth'
import { ToothEditor } from './ToothEditor'
import { TreatmentLog } from './TreatmentLog'
import { OdontogramDiagnosis } from './OdontogramDiagnosis'
import { WholeStateGlyph } from './odontogramSymbols'
import { useMe } from '@/features/auth/hooks'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'
import {
  FACE_STATE_COLORS,
  FACE_STATE_LABELS,
  PERMANENT_TEETH,
  WHOLE_STATE_LABELS,
  type FaceState,
  type ToothState,
  type WholeToothState,
} from '@/shared/types/odontogram'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const WHOLE_STATES: WholeToothState[] = [
  'absent',
  'crown',
  'endodontics',
  'implant',
  'fracture',
  'extraction_indicated',
  'prosthesis',
]

const FACE_STATES: FaceState[] = ['healthy', 'caries', 'restored', 'sealant', 'defective']

function ArchRow({
  teeth,
  selectedNumber,
  onSelect,
}: {
  teeth: ToothState[]
  selectedNumber: number | null
  onSelect: (n: number) => void
}) {
  return (
    <div className="flex gap-0.5 sm:gap-1 justify-center min-w-max">
      {teeth.map((t) => (
        <Tooth
          key={t.tooth_number}
          tooth={t}
          selected={selectedNumber === t.tooth_number}
          onSelect={() => onSelect(t.tooth_number)}
        />
      ))}
    </div>
  )
}

export function OdontogramTab({ patientId }: { patientId: number }) {
  const odontogram = useOdontogram(patientId)
  const { data: me } = useMe()
  const canEdit = me?.permissions.includes('clinical.manage') ?? false
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [selected, setSelected] = useState<number | null>(null)

  const indexed = useMemo(() => {
    const m = new Map<number, ToothState>()
    odontogram.data?.data.forEach((t) => m.set(t.tooth_number, t))
    return m
  }, [odontogram.data])

  const selectedTooth = selected ? indexed.get(selected) : null

  if (odontogram.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // Arcada superior derecha → izquierda del paciente: 18..11, 21..28
  // Arcada inferior izquierda → derecha del paciente: 48..41, 31..38
  const upperOrder = PERMANENT_TEETH.slice(0, 16)
  const lowerOrder = PERMANENT_TEETH.slice(16)

  const upperTeeth = upperOrder
    .map((n) => indexed.get(n))
    .filter((t): t is ToothState => !!t)
  const lowerTeeth = lowerOrder
    .map((n) => indexed.get(n))
    .filter((t): t is ToothState => !!t)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            window.open(`/pacientes/${patientId}/odontograma/imprimir`, '_blank', 'noopener')
          }
        >
          <Printer className="size-4" /> Imprimir / PDF
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6 space-y-6 lg:space-y-0">
        {/* Columna principal */}
        <div className="space-y-6 min-w-0">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4 overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  Maxilar superior
                </div>
                <ArchRow
                  teeth={upperTeeth}
                  selectedNumber={selected}
                  onSelect={setSelected}
                />
                <div className="border-b border-dashed mx-auto max-w-md" />
                <ArchRow
                  teeth={lowerTeeth}
                  selectedNumber={selected}
                  onSelect={setSelected}
                />
                <div className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                  Maxilar inferior
                </div>
              </div>
            </CardContent>
          </Card>

          <Legend />

          <OdontogramDiagnosis
            patientId={patientId}
            value={odontogram.data?.meta.general_diagnosis ?? null}
            canEdit={canEdit}
          />

          <TreatmentLog patientId={patientId} defaultToothNumber={selected} />
        </div>

        {/* Editor del diente — panel fijo a la derecha en escritorio */}
        {isDesktop ? (
          <aside className="lg:sticky lg:top-6">
            {selectedTooth ? (
              <ToothEditor
                patientId={patientId}
                tooth={selectedTooth}
                readOnly={!canEdit}
                onClose={() => setSelected(null)}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Toca un diente del odontograma para ver o registrar su estado.
                </CardContent>
              </Card>
            )}
          </aside>
        ) : null}
      </div>

      {/* En móvil, el editor se abre en un panel deslizable para no desplazarse. */}
      {!isDesktop ? (
        <Sheet
          open={!!selectedTooth}
          onOpenChange={(o) => {
            if (!o) setSelected(null)
          }}
        >
          <SheetContent
            side="bottom"
            className="max-h-[88vh] overflow-y-auto p-0 pt-2"
          >
            <SheetTitle className="sr-only">
              Diente {selected ?? ''}
            </SheetTitle>
            {selectedTooth ? (
              <ToothEditor
                patientId={patientId}
                tooth={selectedTooth}
                readOnly={!canEdit}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  )
}

function Legend() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Caras del diente
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {FACE_STATES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full border"
                  style={{ background: FACE_STATE_COLORS[s] }}
                />
                {FACE_STATE_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Estado global
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5 text-xs text-foreground">
            {WHOLE_STATES.map((s) => (
              <li key={s} className="flex items-center gap-1.5">
                <WholeStateGlyph state={s} />
                {WHOLE_STATE_LABELS[s]}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
