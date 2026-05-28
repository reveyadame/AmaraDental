/**
 * Catálogo de especialidades odontológicas. Se guarda la clave en
 * `specialist.specialty`; las vistas muestran la etiqueta. Los valores de
 * texto libre previos (legacy) se conservan y se muestran tal cual.
 */
export const SPECIALTIES: { key: string; label: string }[] = [
  { key: 'general', label: 'Odontología general' },
  { key: 'endodoncia', label: 'Endodoncia' },
  { key: 'ortodoncia', label: 'Ortodoncia' },
  { key: 'periodoncia', label: 'Periodoncia' },
  { key: 'odontopediatria', label: 'Odontopediatría' },
  { key: 'prostodoncia', label: 'Prostodoncia' },
  { key: 'cirugia_maxilofacial', label: 'Cirugía oral y maxilofacial' },
  { key: 'implantologia', label: 'Implantología' },
  { key: 'rehabilitacion', label: 'Rehabilitación oral' },
  { key: 'odontologia_estetica', label: 'Odontología estética' },
  { key: 'patologia', label: 'Patología y medicina oral' },
  { key: 'radiologia', label: 'Radiología oral y maxilofacial' },
]

const SPECIALTY_LABELS: Record<string, string> = Object.fromEntries(
  SPECIALTIES.map((s) => [s.key, s.label]),
)

/** Etiqueta legible; si es texto libre previo, lo devuelve tal cual. */
export function specialtyLabel(value: string | null | undefined): string {
  if (!value) return 'Odontología general'
  return SPECIALTY_LABELS[value] ?? value
}

/** True si la especialidad corresponde a un endodoncista (incluye legacy). */
export function isEndodoncista(value: string | null | undefined): boolean {
  if (!value) return false
  return value === 'endodoncia' || /endodonc/i.test(value)
}
