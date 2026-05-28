export type PulpalDiagnosis =
  | 'normal'
  | 'reversible_pulpitis'
  | 'symptomatic_irreversible_pulpitis'
  | 'asymptomatic_irreversible_pulpitis'
  | 'pulp_necrosis'
  | 'previously_treated'
  | 'previously_initiated'

export type PeriapicalDiagnosis =
  | 'normal'
  | 'symptomatic_apical_periodontitis'
  | 'asymptomatic_apical_periodontitis'
  | 'acute_apical_abscess'
  | 'chronic_apical_abscess'
  | 'condensing_osteitis'

export type TestResponse =
  | 'not_done'
  | 'normal'
  | 'no_response'
  | 'lingering'
  | 'exaggerated'

export type PercussionPalpation = 'not_done' | 'negative' | 'positive'

export type Prognosis = 'favorable' | 'questionable' | 'unfavorable'

export const PULPAL_DIAGNOSIS_LABELS: Record<PulpalDiagnosis, string> = {
  normal: 'Pulpa normal',
  reversible_pulpitis: 'Pulpitis reversible',
  symptomatic_irreversible_pulpitis: 'Pulpitis irreversible sintomática',
  asymptomatic_irreversible_pulpitis: 'Pulpitis irreversible asintomática',
  pulp_necrosis: 'Necrosis pulpar',
  previously_treated: 'Previamente tratado',
  previously_initiated: 'Previamente iniciado',
}

export const PERIAPICAL_DIAGNOSIS_LABELS: Record<PeriapicalDiagnosis, string> = {
  normal: 'Tejidos apicales normales',
  symptomatic_apical_periodontitis: 'Periodontitis apical sintomática',
  asymptomatic_apical_periodontitis: 'Periodontitis apical asintomática',
  acute_apical_abscess: 'Absceso apical agudo',
  chronic_apical_abscess: 'Absceso apical crónico',
  condensing_osteitis: 'Osteítis condensante',
}

export const TEST_RESPONSE_LABELS: Record<TestResponse, string> = {
  not_done: 'No realizada',
  normal: 'Normal',
  no_response: 'Sin respuesta',
  lingering: 'Dolor persistente',
  exaggerated: 'Respuesta exagerada',
}

export const PERCUSSION_PALPATION_LABELS: Record<PercussionPalpation, string> = {
  not_done: 'No realizada',
  negative: 'Negativa',
  positive: 'Positiva',
}

export const PROGNOSIS_LABELS: Record<Prognosis, string> = {
  favorable: 'Favorable',
  questionable: 'Dudoso',
  unfavorable: 'Desfavorable',
}

export interface EndodonticLogEntry {
  date: string
  description: string
}

export interface EndodonticRecord {
  id: number
  patient_id: number
  tooth_number: number | null
  performed_on: string | null
  chief_complaint: string | null
  pulpal_diagnosis: PulpalDiagnosis | null
  periapical_diagnosis: PeriapicalDiagnosis | null
  cold_test: TestResponse | null
  heat_test: TestResponse | null
  electric_test: TestResponse | null
  percussion: PercussionPalpation | null
  palpation: PercussionPalpation | null
  mobility: string | null
  radiographic_findings: string | null
  canals_count: number | null
  working_length: string | null
  irrigation: string | null
  intracanal_medication: string | null
  obturation_technique: string | null
  sealer: string | null
  sessions: number | null
  prognosis: Prognosis | null
  treatment_plan: string | null
  treatment_log: EndodonticLogEntry[]
  specialist_id: number | null
  specialist_name?: string | null
  created_by_name?: string | null
  created_at: string | null
  updated_at: string | null
}

export interface EndodonticRecordPayload {
  tooth_number: number
  performed_on?: string | null
  chief_complaint?: string | null
  pulpal_diagnosis?: PulpalDiagnosis | null
  periapical_diagnosis?: PeriapicalDiagnosis | null
  cold_test?: TestResponse | null
  heat_test?: TestResponse | null
  electric_test?: TestResponse | null
  percussion?: PercussionPalpation | null
  palpation?: PercussionPalpation | null
  mobility?: string | null
  radiographic_findings?: string | null
  canals_count?: number | null
  working_length?: string | null
  irrigation?: string | null
  intracanal_medication?: string | null
  obturation_technique?: string | null
  sealer?: string | null
  sessions?: number | null
  prognosis?: Prognosis | null
  treatment_plan?: string | null
  treatment_log?: EndodonticLogEntry[]
  specialist_id?: number | null
}
