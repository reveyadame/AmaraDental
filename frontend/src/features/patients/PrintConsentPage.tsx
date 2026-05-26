import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePatient, useConsent } from './hooks'
import { useBranding } from '@/shared/theme/ThemeProvider'

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

/**
 * Página de impresión del consentimiento informado firmado por el paciente.
 * Fuera del AppShell, A4, con la firma digital capturada renderizada como
 * imagen PNG. NOM-004-SSA3-2012.
 *
 * Auto-dispara window.print() al cargar.
 */
export function PrintConsentPage() {
  const params = useParams<{ id: string; consentId: string }>()
  const patientId = params.id ? Number(params.id) : undefined
  const consentId = params.consentId ? Number(params.consentId) : undefined

  const patient = usePatient(patientId)
  const consent = useConsent(patientId ?? 0, consentId)
  const { branding } = useBranding()

  const ready =
    !!patient.data && !!consent.data && !patient.isPending && !consent.isPending

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(id)
  }, [ready])

  if (!patientId || !consentId || Number.isNaN(patientId) || Number.isNaN(consentId)) {
    return <Navigate to="/pacientes" replace />
  }

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const p = patient.data!
  const c = consent.data!
  const signedDate = formatDate(c.signed_at)
  const signedTime = formatTime(c.signed_at)
  const now = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })

  return (
    <main className="bg-white text-black min-h-screen p-6 sm:p-10 print:p-0">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Encabezado clínica */}
        <header className="flex items-start justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-12 w-auto" />
            ) : (
              <div className="grid size-12 place-items-center rounded-md bg-black text-white text-sm font-bold">
                {(branding?.brand_name ?? 'CD').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xl font-semibold leading-tight">
                {branding?.brand_name ?? 'CIO Dent'}
              </p>
              {branding?.razon_social ? (
                <p className="text-xs text-gray-600">{branding.razon_social}</p>
              ) : null}
              {branding?.address ? (
                <p className="text-xs text-gray-600">{branding.address}</p>
              ) : null}
              <p className="text-xs text-gray-600">
                {branding?.phones && branding.phones.length > 0
                  ? `Tel: ${branding.phones.join(' · ')}`
                  : ''}
                {branding?.rfc ? ` · RFC: ${branding.rfc}` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold uppercase tracking-wide">
              Consentimiento informado
            </p>
            <p className="text-xs text-gray-600 font-mono">CI-{c.id.toString().padStart(5, '0')}</p>
            <p className="text-xs text-gray-600">
              {signedDate}
              {signedTime ? ` · ${signedTime} h` : ''}
            </p>
          </div>
        </header>

        {/* Paciente */}
        <section className="grid grid-cols-3 gap-4 text-sm border-b pb-3">
          <div className="col-span-3 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Paciente</p>
            <p className="font-medium">{p.full_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Edad · Sexo</p>
            <p>
              {p.age != null ? `${p.age} años` : '—'}
              {p.gender
                ? ` · ${p.gender === 'F' ? 'Femenino' : p.gender === 'M' ? 'Masculino' : 'Otro'}`
                : ''}
            </p>
          </div>
        </section>

        {/* Título del consentimiento */}
        <section>
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Documento</p>
          <h1 className="text-lg font-semibold">{c.title}</h1>
        </section>

        {/* Cuerpo del consentimiento (texto ya con variables sustituidas) */}
        <section className="text-sm whitespace-pre-wrap leading-relaxed">
          {c.body ?? ''}
        </section>

        {/* Firma */}
        <section className="pt-8 space-y-3">
          <p className="text-xs">
            En constancia de lectura y comprensión, firmo el presente documento de manera
            libre y voluntaria.
          </p>

          <div className="grid grid-cols-2 gap-12 pt-6">
            <div className="text-center space-y-1">
              {c.signature_image ? (
                <img
                  src={c.signature_image}
                  alt="Firma del paciente"
                  className="mx-auto h-20 object-contain"
                />
              ) : (
                <div className="h-20" />
              )}
              <div className="border-t-2 border-black mx-2" />
              <p className="text-xs font-medium">Firma</p>
              <p className="text-[11px] text-gray-700">{c.signed_by_name}</p>
              <p className="text-[10px] text-gray-600">
                {signedDate}
                {signedTime ? ` · ${signedTime} h` : ''}
              </p>
            </div>
            <div className="text-center space-y-1">
              <div className="h-20" />
              <div className="border-t-2 border-black mx-2" />
              <p className="text-xs font-medium">Profesional tratante</p>
              <p className="text-[10px] text-gray-500 italic">
                (firma y sello en físico al entregar el documento)
              </p>
            </div>
          </div>
        </section>

        <footer className="text-[10px] text-gray-500 border-t pt-3 mt-6">
          Documento generado por {branding?.brand_name ?? 'CIO Dent'} el {now}. Conforme a la
          NOM-004-SSA3-2012 (expediente clínico). Conserve este documento.
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
