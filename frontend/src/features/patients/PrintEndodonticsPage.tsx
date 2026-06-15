import { usePrintOnLoad } from '@/shared/lib/use-print-on-load'
import { DEFAULT_BRAND_NAME } from '@/shared/lib/brand'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePatient } from './hooks'
import { useEndodonticRecords } from './useEndodontics'
import { useBranding } from '@/shared/theme/ThemeProvider'
import {
  PERCUSSION_PALPATION_LABELS,
  PERIAPICAL_DIAGNOSIS_LABELS,
  PROGNOSIS_LABELS,
  PULPAL_DIAGNOSIS_LABELS,
  TEST_RESPONSE_LABELS,
  type EndodonticRecord,
} from '@/shared/types/endodontics'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function RecordBlock({ r }: { r: EndodonticRecord }) {
  const tests = [
    r.cold_test ? `Frío: ${TEST_RESPONSE_LABELS[r.cold_test]}` : null,
    r.heat_test ? `Calor: ${TEST_RESPONSE_LABELS[r.heat_test]}` : null,
    r.electric_test ? `Eléctrica: ${TEST_RESPONSE_LABELS[r.electric_test]}` : null,
    r.percussion ? `Percusión: ${PERCUSSION_PALPATION_LABELS[r.percussion]}` : null,
    r.palpation ? `Palpación: ${PERCUSSION_PALPATION_LABELS[r.palpation]}` : null,
    r.mobility ? `Movilidad: grado ${r.mobility}` : null,
  ].filter(Boolean) as string[]

  const sortedLog = [...(r.treatment_log ?? [])].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <section className="border rounded-lg p-4 space-y-3 break-inside-avoid">
      <div className="flex items-baseline justify-between border-b pb-2">
        <p className="text-base font-semibold">Diente {r.tooth_number ?? '—'}</p>
        <p className="text-xs text-gray-600">
          {formatDate(r.performed_on)}
          {r.specialist_name ? ` · ${r.specialist_name}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field
          label="Diagnóstico pulpar"
          value={r.pulpal_diagnosis ? PULPAL_DIAGNOSIS_LABELS[r.pulpal_diagnosis] : null}
        />
        <Field
          label="Diagnóstico periapical"
          value={r.periapical_diagnosis ? PERIAPICAL_DIAGNOSIS_LABELS[r.periapical_diagnosis] : null}
        />
        <Field
          label="Pronóstico"
          value={r.prognosis ? PROGNOSIS_LABELS[r.prognosis] : null}
        />
      </div>

      {r.chief_complaint ? <Field label="Motivo de consulta" value={r.chief_complaint} /> : null}

      {tests.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Pruebas diagnósticas</p>
          <p className="text-sm">{tests.join(' · ')}</p>
        </div>
      ) : null}

      {r.radiographic_findings ? (
        <Field label="Hallazgos radiográficos" value={r.radiographic_findings} />
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="N.º de conductos" value={r.canals_count} />
        <Field label="Sesiones" value={r.sessions} />
        <Field label="Longitud de trabajo" value={r.working_length} />
        <Field label="Irrigación" value={r.irrigation} />
        <Field label="Medicación intraconducto" value={r.intracanal_medication} />
        <Field label="Técnica de obturación" value={r.obturation_technique} />
        <Field label="Cemento sellador" value={r.sealer} />
      </div>

      {r.treatment_plan ? <Field label="Plan de tratamiento" value={r.treatment_plan} /> : null}

      {sortedLog.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
            Bitácora del tratamiento
          </p>
          <ul className="space-y-0.5">
            {sortedLog.map((entry, i) => (
              <li key={`${entry.date}-${i}`} className="flex gap-2 text-sm">
                <span className="shrink-0 tabular-nums text-gray-600">{formatDate(entry.date)}</span>
                <span>{entry.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

/**
 * Hoja imprimible de la historia clínica de endodoncia del paciente. Tamaño
 * carta, auto-print al cargar.
 */
export function PrintEndodonticsPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const patient = usePatient(id)
  const records = useEndodonticRecords(id ?? 0)
  const { branding } = useBranding()

  const ready = !!patient.data && !patient.isPending && !records.isPending

  usePrintOnLoad(ready)

  if (!id || Number.isNaN(id)) return <Navigate to="/pacientes" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const p = patient.data!
  const list = records.data ?? []
  const now = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <main className="bg-white text-black min-h-screen p-6 sm:p-10 print:p-0">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-10 w-auto" />
            ) : (
              <div className="grid size-10 place-items-center rounded-md bg-black text-white text-xs font-bold">
                CD
              </div>
            )}
            <div>
              <p className="text-lg font-semibold leading-tight">
                {branding?.brand_name ?? DEFAULT_BRAND_NAME}
              </p>
              {branding?.address ? (
                <p className="text-xs text-gray-600 leading-tight">{branding.address}</p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Historia clínica de endodoncia</p>
            <p className="text-xs text-gray-600">{now}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
            <p className="font-medium">{p.full_name}</p>
          </div>
          {p.age != null ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Edad</p>
              <p>{p.age} años</p>
            </div>
          ) : null}
        </section>

        {list.length === 0 ? (
          <p className="text-sm text-gray-600">
            No hay registros de endodoncia para este paciente.
          </p>
        ) : (
          <div className="space-y-4">
            {list.map((r) => (
              <RecordBlock key={r.id} r={r} />
            ))}
          </div>
        )}

        <footer className="text-[10px] text-gray-500 border-t pt-3">
          Documento generado por {branding?.brand_name ?? DEFAULT_BRAND_NAME} el {now}. Conforme a la
          NOM-004-SSA3-2012 (expediente clínico).
        </footer>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </main>
  )
}
