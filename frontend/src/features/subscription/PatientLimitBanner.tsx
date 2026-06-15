import { AlertTriangle } from 'lucide-react'
import { useSubscription } from './hooks'

/**
 * Aviso de tope de pacientes. Solo aparece cuando la clínica está cerca (≥90%)
 * o ya llegó al límite de su plan. Visible donde se sienten los límites
 * (lista de pacientes).
 */
export function PatientLimitBanner() {
  const sub = useSubscription()
  const data = sub.data

  if (!data || data.max_patients === null) return null

  const atLimit = data.patients_count >= data.max_patients
  const near = !atLimit && data.patients_count / data.max_patients >= 0.9
  if (!atLimit && !near) return null

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
        atLimit
          ? 'border-destructive/30 bg-destructive/5 text-destructive'
          : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400'
      }`}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>
        {atLimit
          ? `Llegaste al límite de tu plan (${data.patients_count}/${data.max_patients} pacientes). No podrás registrar nuevos pacientes hasta subir de plan — contacta a Amara Dental.`
          : `Estás cerca del límite de tu plan (${data.patients_count}/${data.max_patients} pacientes).`}
      </span>
    </div>
  )
}
