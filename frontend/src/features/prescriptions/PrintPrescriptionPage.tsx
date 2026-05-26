import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePrescription } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'
import { ROUTE_LABEL } from '@/shared/types/prescription'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function pageSize(
  paper: 'letter' | 'letter_landscape' | 'half_letter' | 'half_letter_landscape',
): string {
  switch (paper) {
    case 'letter_landscape':
      return '11in 8.5in'
    case 'half_letter':
      return '5.5in 8.5in'
    case 'half_letter_landscape':
      return '8.5in 5.5in'
    case 'letter':
    default:
      return '8.5in 11in'
  }
}

/**
 * Hoja imprimible de la receta. Configurable desde Ajustes → Impresión:
 * tamaño de papel (carta / media carta, vertical/horizontal), modo
 * (con diseño o solo contenido para hojas membretadas pre-impresas),
 * imagen de fondo opcional, margen superior y densidad (estándar/compacto).
 *
 * Auto-dispara window.print() al cargar para guardar como PDF o imprimir directo.
 */
export function PrintPrescriptionPage() {
  const params = useParams<{ id: string }>()
  const id = params.id ? Number(params.id) : undefined
  const rx = usePrescription(id)
  const { branding } = useBranding()

  const ready = !!rx.data && !rx.isPending

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(t)
  }, [ready])

  if (!id || Number.isNaN(id)) return <Navigate to="/pacientes" replace />

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const r = rx.data!
  const issuedDate = formatDate(r.issued_at)
  const issuedTime = formatTime(r.issued_at)

  const paper = branding?.prescription_paper_size ?? 'letter'
  const mode = branding?.prescription_mode ?? 'design'
  const layout = branding?.prescription_layout ?? 'standard'
  const bgUrl = branding?.prescription_background_url ?? null
  const marginTopMm = branding?.prescription_margin_top_mm ?? 15

  const preprinted = mode === 'preprinted'
  const compact = layout === 'compact'
  const isHalfLetter = paper === 'half_letter' || paper === 'half_letter_landscape'
  const showHeader = !preprinted
  const showBg = !preprinted && !!bgUrl

  const baseFontPx = isHalfLetter ? 11 : 13
  const titleSize = compact || isHalfLetter ? 'text-base' : 'text-xl'
  const sectionGap = compact || isHalfLetter ? 'space-y-3' : 'space-y-5'
  const itemGap = compact || isHalfLetter ? 'space-y-2' : 'space-y-3'
  const sidePadding = isHalfLetter ? 'px-6' : 'px-10'

  return (
    <main
      className="relative bg-white text-black min-h-screen print:p-0"
      style={{ fontSize: `${baseFontPx}px` }}
    >
      {showBg ? (
        <img
          aria-hidden
          src={bgUrl ?? undefined}
          alt=""
          className="pointer-events-none absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
      ) : null}

      <div
        className={`relative mx-auto ${sidePadding} pb-8 ${sectionGap}`}
        style={{
          paddingTop: `${marginTopMm}mm`,
          maxWidth: isHalfLetter ? '5.5in' : paper === 'letter_landscape' ? '11in' : '8.5in',
          zIndex: 1,
        }}
      >
        <div>
          {showHeader ? (
            <header
              className={`flex items-start justify-between border-b pb-3 ${compact ? 'mb-3' : 'mb-4'}`}
            >
              <div className="flex items-center gap-3">
                {branding?.logo_url ? (
                  <img
                    src={branding.logo_url}
                    alt=""
                    className={isHalfLetter || compact ? 'h-10 w-auto' : 'h-12 w-auto'}
                  />
                ) : (
                  <div className="grid size-12 place-items-center rounded-md bg-black text-white text-sm font-bold">
                    {(branding?.brand_name ?? 'CD').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={`${titleSize} font-semibold leading-tight`}>
                    {branding?.brand_name ?? 'CIO Dent'}
                  </p>
                  {branding?.razon_social ? (
                    <p className="text-[10px] text-gray-600">{branding.razon_social}</p>
                  ) : null}
                  {branding?.address ? (
                    <p className="text-[10px] text-gray-600">{branding.address}</p>
                  ) : null}
                  <p className="text-[10px] text-gray-600">
                    {branding?.phones && branding.phones.length > 0
                      ? `Tel: ${branding.phones.join(' · ')}`
                      : ''}
                    {branding?.rfc ? ` · RFC: ${branding.rfc}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide">Receta médica</p>
                <p className="text-[10px] text-gray-600 font-mono">{r.code}</p>
                <p className="text-[10px] text-gray-600">
                  {issuedDate}
                  {issuedTime ? ` · ${issuedTime} h` : ''}
                </p>
              </div>
            </header>
          ) : (
            // Preprinted: solo folio + fecha discretos arriba a la derecha
            <header className="flex justify-end pb-1 mb-2">
              <div className="text-right">
                <p className="text-[10px] text-gray-700 font-mono">{r.code}</p>
                <p className="text-[10px] text-gray-700">
                  {issuedDate}
                  {issuedTime ? ` · ${issuedTime} h` : ''}
                </p>
              </div>
            </header>
          )}

          {/* Médico prescriptor — se omite en preprinted (membrete ya lo trae) */}
          {!preprinted ? (
            <section
              className={`rounded border border-gray-300 ${compact ? 'p-2' : 'p-3'} ${compact ? 'mb-3' : 'mb-4'}`}
            >
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-0.5">
                Médico prescriptor
              </p>
              <p className="text-sm font-semibold">{r.specialist_name}</p>
              <p className="text-[11px] text-gray-700">
                {r.specialist_specialty ?? 'Odontología general'}
                {r.specialist_cedula ? (
                  <>
                    {' '}
                    · Cédula Profesional:{' '}
                    <span className="font-mono">{r.specialist_cedula}</span>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}

          {/* Paciente */}
          <section
            className={`grid grid-cols-3 gap-4 ${compact ? 'mb-3' : 'mb-4'}`}
            style={{ fontSize: `${baseFontPx}px` }}
          >
            <div className="col-span-3 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
              <p className="font-medium">{r.patient_name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Edad · Sexo</p>
              <p>
                {r.patient_age != null ? `${r.patient_age} años` : '—'}
                {r.patient_gender
                  ? ` · ${r.patient_gender === 'F' ? 'Femenino' : r.patient_gender === 'M' ? 'Masculino' : 'Otro'}`
                  : ''}
              </p>
            </div>
          </section>

          {r.diagnosis ? (
            <section className={compact ? 'mb-2' : 'mb-3'}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Diagnóstico</p>
              <p className="whitespace-pre-wrap">{r.diagnosis}</p>
            </section>
          ) : null}

          {/* Medicamentos */}
          <section className={compact ? 'mb-3' : 'mb-4'}>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-2">
              Rx · Indicaciones
            </p>
            <ol className={itemGap}>
              {r.items.map((it, idx) => (
                <li
                  key={it.id}
                  className={`border-l-4 border-black pl-3 ${compact ? 'py-0.5' : 'py-1'}`}
                >
                  <p
                    className={`${compact || isHalfLetter ? 'text-sm' : 'text-base'} font-semibold leading-tight`}
                  >
                    {idx + 1}. {it.medication}
                    {it.presentation ? (
                      <span className="font-normal text-gray-700"> — {it.presentation}</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5">
                    <span className="font-semibold">{it.dosage}</span>
                    {it.route ? ` · Vía ${ROUTE_LABEL[it.route] ?? it.route}` : ''}
                    {' · '}
                    {it.frequency}
                    {' · '}
                    Por {it.duration}
                  </p>
                  {it.instructions ? (
                    <p className="text-[11px] italic text-gray-700 mt-0.5">{it.instructions}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          {r.notes ? (
            <section className={`border-t pt-2 ${compact ? 'mb-3' : 'mb-4'}`}>
              <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                Indicaciones generales
              </p>
              <p className="whitespace-pre-wrap">{r.notes}</p>
            </section>
          ) : null}

          {/* Espacio para firma — centrado */}
          {!preprinted ? (
            <section className={`${compact || isHalfLetter ? 'pt-10' : 'pt-14'} flex justify-center`}>
              <div className="w-64 text-center">
                <div
                  className={`border-t-2 border-black pt-2 mx-4 ${compact || isHalfLetter ? 'min-h-[50px]' : 'min-h-[80px]'}`}
                />
                <p className="text-[11px] font-medium">Firma del médico</p>
                <p className="text-[10px] text-gray-700 mt-0.5">{r.specialist_name}</p>
                {r.specialist_cedula ? (
                  <p className="text-[10px] text-gray-600 font-mono">
                    Céd. Prof. {r.specialist_cedula}
                  </p>
                ) : null}
              </div>
            </section>
          ) : (
            // Preprinted: solo un espacio para firma sin etiquetas (el membrete las trae)
            <section className={`${compact ? 'pt-6' : 'pt-8'} flex justify-center`}>
              <div className="w-64 text-center">
                <div
                  className={`border-t border-black pt-1 mx-4 ${compact ? 'min-h-[40px]' : 'min-h-[60px]'}`}
                />
              </div>
            </section>
          )}

          {!preprinted ? (
            <footer className="text-[9px] text-gray-500 border-t pt-2 mt-6">
              Receta emitida conforme a la NOM-004-SSA3-2012. Conserve este documento. Para
              dudas o reacciones adversas, contacte al consultorio.
            </footer>
          ) : null}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          @page { margin: 0; size: ${pageSize(paper)}; }
        }
      `}</style>
    </main>
  )
}
