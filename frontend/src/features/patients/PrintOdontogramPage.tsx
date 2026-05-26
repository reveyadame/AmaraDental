import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePatient } from './hooks'
import { useOdontogram } from './useOdontogram'
import { Tooth } from './Tooth'
import { useBranding } from '@/shared/theme/ThemeProvider'
import {
  FACE_STATE_COLORS,
  FACE_STATE_LABELS,
  PERMANENT_TEETH,
  WHOLE_STATE_LABELS,
  type FaceState,
  type WholeToothState,
  type ToothState,
} from '@/shared/types/odontogram'

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

function ArchRow({ teeth }: { teeth: ToothState[] }) {
  return (
    <div className="flex gap-1 justify-center">
      {teeth.map((t) => (
        <Tooth key={t.tooth_number} tooth={t} />
      ))}
    </div>
  )
}

/**
 * Página dedicada para imprimir (o guardar como PDF) el odontograma del
 * paciente. Se monta fuera del AppShell para que la salida impresa quede
 * limpia. Auto-dispara window.print() al cargar.
 */
export function PrintOdontogramPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const patient = usePatient(id)
  const odontogram = useOdontogram(id ?? 0)
  const { branding } = useBranding()

  const ready =
    !!patient.data && !!odontogram.data && !patient.isPending && !odontogram.isPending

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(id)
  }, [ready])

  if (!id || Number.isNaN(id)) return <Navigate to="/pacientes" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const indexed = new Map<number, ToothState>()
  odontogram.data!.data.forEach((t) => indexed.set(t.tooth_number, t))
  const upperOrder = PERMANENT_TEETH.slice(0, 16)
  const lowerOrder = PERMANENT_TEETH.slice(16)
  const upperTeeth = upperOrder
    .map((n) => indexed.get(n))
    .filter((t): t is ToothState => !!t)
  const lowerTeeth = lowerOrder
    .map((n) => indexed.get(n))
    .filter((t): t is ToothState => !!t)

  const p = patient.data!
  const dateOfBirth = p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('es-MX') : '—'
  const now = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  const teethWithFindings = odontogram.data!.data.filter(
    (t) =>
      t.whole_state ||
      Object.values(t.faces).some((s) => s !== 'healthy') ||
      (t.notes && t.notes.trim().length > 0),
  )

  return (
    <main className="bg-white text-black min-h-screen p-6 sm:p-10 print:p-0">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Encabezado */}
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
                {branding?.brand_name ?? 'CIO Dent'}
              </p>
              {branding?.address ? (
                <p className="text-xs text-gray-600 leading-tight">{branding.address}</p>
              ) : null}
              {branding?.phones && branding.phones.length > 0 ? (
                <p className="text-xs text-gray-600 leading-tight">
                  Tel: {branding.phones.join(' · ')}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Odontograma</p>
            <p className="text-xs text-gray-600">{now}</p>
          </div>
        </header>

        {/* Paciente */}
        <section className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
            <p className="font-medium">{p.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Fecha de nacimiento</p>
            <p>
              {dateOfBirth}
              {p.age != null ? ` · ${p.age} años` : ''}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Sexo</p>
            <p>{p.gender === 'F' ? 'Femenino' : p.gender === 'M' ? 'Masculino' : 'Otro'}</p>
          </div>
          {p.curp ? (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">CURP</p>
              <p className="font-mono text-xs">{p.curp}</p>
            </div>
          ) : null}
        </section>

        {/* Odontograma */}
        <section className="space-y-3 border rounded-lg p-4">
          <p className="text-center text-[10px] uppercase tracking-wide text-gray-500">
            Maxilar superior
          </p>
          <ArchRow teeth={upperTeeth} />
          <div className="border-b border-dashed mx-auto max-w-md" />
          <ArchRow teeth={lowerTeeth} />
          <p className="text-center text-[10px] uppercase tracking-wide text-gray-500">
            Maxilar inferior
          </p>
        </section>

        {/* Leyenda */}
        <section className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-semibold mb-1">Caras del diente</p>
            <ul className="space-y-1">
              {FACE_STATES.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full border border-gray-700"
                    style={{ background: FACE_STATE_COLORS[s] }}
                  />
                  {FACE_STATE_LABELS[s]}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Estado global</p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
              {WHOLE_STATES.map((s) => (
                <li key={s}>{WHOLE_STATE_LABELS[s]}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Hallazgos en detalle */}
        {teethWithFindings.length > 0 ? (
          <section className="space-y-2">
            <p className="text-sm font-semibold">Detalle por diente</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 px-2 w-12">#</th>
                  <th className="text-left py-1 px-2">Estado global</th>
                  <th className="text-left py-1 px-2">Caras afectadas</th>
                  <th className="text-left py-1 px-2">Notas</th>
                </tr>
              </thead>
              <tbody>
                {teethWithFindings.map((t) => {
                  const affected = Object.entries(t.faces)
                    .filter(([, s]) => s !== 'healthy')
                    .map(([k, s]) => `${k}: ${FACE_STATE_LABELS[s]}`)
                    .join(' · ')
                  return (
                    <tr key={t.tooth_number} className="border-b align-top">
                      <td className="py-1 px-2 font-mono">{t.tooth_number}</td>
                      <td className="py-1 px-2">
                        {t.whole_state ? WHOLE_STATE_LABELS[t.whole_state] : '—'}
                      </td>
                      <td className="py-1 px-2">{affected || '—'}</td>
                      <td className="py-1 px-2">{t.notes ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ) : null}

        <footer className="text-[10px] text-gray-500 border-t pt-3">
          Documento generado por {branding?.brand_name ?? 'CIO Dent'} el {now}. Conforme a la
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
