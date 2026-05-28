import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useSaveEndodonticRecord } from './useEndodontics'
import { ToothPicker } from './ToothPicker'
import { useSpecialists } from '@/features/specialists/hooks'
import { isEndodoncista } from '@/features/specialists/specialties'
import {
  PERCUSSION_PALPATION_LABELS,
  PERIAPICAL_DIAGNOSIS_LABELS,
  PROGNOSIS_LABELS,
  PULPAL_DIAGNOSIS_LABELS,
  TEST_RESPONSE_LABELS,
  type EndodonticLogEntry,
  type EndodonticRecord,
  type EndodonticRecordPayload,
  type PercussionPalpation,
  type PeriapicalDiagnosis,
  type Prognosis,
  type PulpalDiagnosis,
  type TestResponse,
} from '@/shared/types/endodontics'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: number
  record?: EndodonticRecord | null
  defaultToothNumber?: number | null
}

interface FormState {
  tooth_number: string
  performed_on: string
  specialist_id: string
  chief_complaint: string
  pulpal_diagnosis: string
  periapical_diagnosis: string
  cold_test: string
  heat_test: string
  electric_test: string
  percussion: string
  palpation: string
  mobility: string
  radiographic_findings: string
  canals_count: string
  working_length: string
  irrigation: string
  intracanal_medication: string
  obturation_technique: string
  sealer: string
  sessions: string
  prognosis: string
  treatment_plan: string
}

function todayISO(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function emptyForm(defaultTooth?: number | null): FormState {
  return {
    tooth_number: defaultTooth ? String(defaultTooth) : '',
    performed_on: todayISO(),
    specialist_id: '',
    chief_complaint: '',
    pulpal_diagnosis: '',
    periapical_diagnosis: '',
    cold_test: '',
    heat_test: '',
    electric_test: '',
    percussion: '',
    palpation: '',
    mobility: '',
    radiographic_findings: '',
    canals_count: '',
    working_length: '',
    irrigation: '',
    intracanal_medication: '',
    obturation_technique: '',
    sealer: '',
    sessions: '',
    prognosis: '',
    treatment_plan: '',
  }
}

function fromRecord(r: EndodonticRecord): FormState {
  return {
    tooth_number: r.tooth_number ? String(r.tooth_number) : '',
    performed_on: r.performed_on ?? '',
    specialist_id: r.specialist_id ? String(r.specialist_id) : '',
    chief_complaint: r.chief_complaint ?? '',
    pulpal_diagnosis: r.pulpal_diagnosis ?? '',
    periapical_diagnosis: r.periapical_diagnosis ?? '',
    cold_test: r.cold_test ?? '',
    heat_test: r.heat_test ?? '',
    electric_test: r.electric_test ?? '',
    percussion: r.percussion ?? '',
    palpation: r.palpation ?? '',
    mobility: r.mobility ?? '',
    radiographic_findings: r.radiographic_findings ?? '',
    canals_count: r.canals_count != null ? String(r.canals_count) : '',
    working_length: r.working_length ?? '',
    irrigation: r.irrigation ?? '',
    intracanal_medication: r.intracanal_medication ?? '',
    obturation_technique: r.obturation_technique ?? '',
    sealer: r.sealer ?? '',
    sessions: r.sessions != null ? String(r.sessions) : '',
    prognosis: r.prognosis ?? '',
    treatment_plan: r.treatment_plan ?? '',
  }
}

function EnumSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || 'none'} onValueChange={(v) => onChange(v === 'none' ? '' : v)}>
        <SelectTrigger>
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          <SelectItem value="none">Sin especificar</SelectItem>
          {options.map(([val, lab]) => (
            <SelectItem key={val} value={val}>
              {lab}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </legend>
  )
}

export function EndodonticRecordDialog({
  open,
  onOpenChange,
  patientId,
  record,
  defaultToothNumber = null,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {record ? 'Editar registro de endodoncia' : 'Nuevo registro de endodoncia'}
          </DialogTitle>
          <DialogDescription>
            Historia clínica endodóntica del diente: diagnóstico, pruebas, tratamiento de
            conductos y pronóstico.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <RecordForm
            key={record?.id ?? 'new'}
            patientId={patientId}
            record={record ?? null}
            defaultToothNumber={defaultToothNumber}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function RecordForm({
  patientId,
  record,
  defaultToothNumber,
  onDone,
}: {
  patientId: number
  record: EndodonticRecord | null
  defaultToothNumber: number | null
  onDone: () => void
}) {
  const isEdit = !!record
  const save = useSaveEndodonticRecord(patientId)
  const specialists = useSpecialists()
  const [form, setForm] = useState<FormState>(() =>
    record ? fromRecord(record) : emptyForm(defaultToothNumber),
  )
  const [log, setLog] = useState<EndodonticLogEntry[]>(
    () => record?.treatment_log ?? [],
  )
  const [newDate, setNewDate] = useState(todayISO())
  const [newDesc, setNewDesc] = useState('')

  const set = <K extends keyof FormState>(k: K, v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  // Solo endodoncistas; conserva al especialista ya asignado aunque cambie.
  const endoSpecialists = (specialists.data ?? []).filter(
    (s) => isEndodoncista(s.specialty) || String(s.id) === form.specialist_id,
  )

  const addLogEntry = () => {
    if (!newDesc.trim()) {
      toast.error('Describe qué se realizó')
      return
    }
    setLog((prev) => [...prev, { date: newDate || todayISO(), description: newDesc.trim() }])
    setNewDesc('')
  }

  const removeLogEntry = (index: number) =>
    setLog((prev) => prev.filter((_, i) => i !== index))

  const sortedLog = [...log].sort((a, b) => b.date.localeCompare(a.date))

  const onSubmit = () => {
    if (!form.tooth_number) {
      toast.error('Selecciona el diente tratado')
      return
    }
    const payload: EndodonticRecordPayload = {
      tooth_number: Number(form.tooth_number),
      performed_on: form.performed_on || null,
      specialist_id: form.specialist_id ? Number(form.specialist_id) : null,
      chief_complaint: form.chief_complaint.trim() || null,
      pulpal_diagnosis: (form.pulpal_diagnosis || null) as PulpalDiagnosis | null,
      periapical_diagnosis: (form.periapical_diagnosis || null) as PeriapicalDiagnosis | null,
      cold_test: (form.cold_test || null) as TestResponse | null,
      heat_test: (form.heat_test || null) as TestResponse | null,
      electric_test: (form.electric_test || null) as TestResponse | null,
      percussion: (form.percussion || null) as PercussionPalpation | null,
      palpation: (form.palpation || null) as PercussionPalpation | null,
      mobility: form.mobility || null,
      radiographic_findings: form.radiographic_findings.trim() || null,
      canals_count: form.canals_count !== '' ? Number(form.canals_count) : null,
      working_length: form.working_length.trim() || null,
      irrigation: form.irrigation.trim() || null,
      intracanal_medication: form.intracanal_medication.trim() || null,
      obturation_technique: form.obturation_technique.trim() || null,
      sealer: form.sealer.trim() || null,
      sessions: form.sessions !== '' ? Number(form.sessions) : null,
      prognosis: (form.prognosis || null) as Prognosis | null,
      treatment_plan: form.treatment_plan.trim() || null,
      treatment_log: log,
    }
    save.mutate(
      { id: record?.id ?? null, payload },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Registro actualizado' : 'Registro de endodoncia creado')
          onDone()
        },
        onError: () => toast.error('No fue posible guardar el registro'),
      },
    )
  }

  const testOptions = Object.entries(TEST_RESPONSE_LABELS)
  const ppOptions = Object.entries(PERCUSSION_PALPATION_LABELS)

  return (
    <>
        <div className="space-y-6">
          {/* Datos del caso */}
          <fieldset className="space-y-3">
            <SectionTitle>Datos del caso</SectionTitle>
            <div className="space-y-1.5">
              <Label>
                Diente <span className="text-destructive">*</span>
              </Label>
              <ToothPicker
                value={form.tooth_number ? Number(form.tooth_number) : null}
                onChange={(n) => set('tooth_number', n ? String(n) : '')}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="endo-date">Fecha</Label>
                <Input
                  id="endo-date"
                  type="date"
                  value={form.performed_on}
                  onChange={(e) => set('performed_on', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Endodoncista</Label>
                <Select
                  value={form.specialist_id || 'none'}
                  onValueChange={(v) => set('specialist_id', v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {endoSpecialists.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {endoSpecialists.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    No hay especialistas con especialidad «Endodoncia».
                  </p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endo-cc">Motivo de consulta</Label>
              <Textarea
                id="endo-cc"
                rows={2}
                value={form.chief_complaint}
                onChange={(e) => set('chief_complaint', e.target.value)}
                placeholder="Dolor espontáneo nocturno, sensibilidad al frío…"
              />
            </div>
          </fieldset>

          {/* Diagnóstico */}
          <fieldset className="space-y-3">
            <SectionTitle>Diagnóstico</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EnumSelect
                label="Diagnóstico pulpar"
                value={form.pulpal_diagnosis}
                onChange={(v) => set('pulpal_diagnosis', v)}
                options={Object.entries(PULPAL_DIAGNOSIS_LABELS)}
              />
              <EnumSelect
                label="Diagnóstico periapical"
                value={form.periapical_diagnosis}
                onChange={(v) => set('periapical_diagnosis', v)}
                options={Object.entries(PERIAPICAL_DIAGNOSIS_LABELS)}
              />
            </div>
          </fieldset>

          {/* Pruebas diagnósticas */}
          <fieldset className="space-y-3">
            <SectionTitle>Pruebas diagnósticas</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <EnumSelect label="Prueba al frío" value={form.cold_test} onChange={(v) => set('cold_test', v)} options={testOptions} />
              <EnumSelect label="Prueba al calor" value={form.heat_test} onChange={(v) => set('heat_test', v)} options={testOptions} />
              <EnumSelect label="Prueba eléctrica" value={form.electric_test} onChange={(v) => set('electric_test', v)} options={testOptions} />
              <EnumSelect label="Percusión" value={form.percussion} onChange={(v) => set('percussion', v)} options={ppOptions} />
              <EnumSelect label="Palpación" value={form.palpation} onChange={(v) => set('palpation', v)} options={ppOptions} />
              <EnumSelect
                label="Movilidad"
                value={form.mobility}
                onChange={(v) => set('mobility', v)}
                options={[
                  ['0', 'Grado 0'],
                  ['1', 'Grado 1'],
                  ['2', 'Grado 2'],
                  ['3', 'Grado 3'],
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endo-rx">Hallazgos radiográficos</Label>
              <Textarea
                id="endo-rx"
                rows={2}
                value={form.radiographic_findings}
                onChange={(e) => set('radiographic_findings', e.target.value)}
                placeholder="Lesión periapical ~3mm, ensanchamiento del ligamento, reabsorción…"
              />
            </div>
          </fieldset>

          {/* Tratamiento de conductos */}
          <fieldset className="space-y-3">
            <SectionTitle>Tratamiento de conductos</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="endo-canals">N.° de conductos</Label>
                <Input
                  id="endo-canals"
                  type="number"
                  min={0}
                  max={8}
                  value={form.canals_count}
                  onChange={(e) => set('canals_count', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endo-sessions">Sesiones</Label>
                <Input
                  id="endo-sessions"
                  type="number"
                  min={0}
                  max={20}
                  value={form.sessions}
                  onChange={(e) => set('sessions', e.target.value)}
                />
              </div>
              <EnumSelect
                label="Pronóstico"
                value={form.prognosis}
                onChange={(v) => set('prognosis', v)}
                options={Object.entries(PROGNOSIS_LABELS)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="endo-wl">Longitud de trabajo</Label>
                <Input
                  id="endo-wl"
                  value={form.working_length}
                  onChange={(e) => set('working_length', e.target.value)}
                  placeholder="MV 21mm · DV 20.5mm · P 22mm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endo-irr">Irrigación</Label>
                <Input
                  id="endo-irr"
                  value={form.irrigation}
                  onChange={(e) => set('irrigation', e.target.value)}
                  placeholder="NaOCl 5.25% + EDTA 17%"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endo-med">Medicación intraconducto</Label>
                <Input
                  id="endo-med"
                  value={form.intracanal_medication}
                  onChange={(e) => set('intracanal_medication', e.target.value)}
                  placeholder="Hidróxido de calcio"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endo-obt">Técnica de obturación</Label>
                <Input
                  id="endo-obt"
                  value={form.obturation_technique}
                  onChange={(e) => set('obturation_technique', e.target.value)}
                  placeholder="Condensación lateral · onda continua"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endo-sealer">Cemento sellador</Label>
                <Input
                  id="endo-sealer"
                  value={form.sealer}
                  onChange={(e) => set('sealer', e.target.value)}
                  placeholder="AH Plus · biocerámico"
                />
              </div>
            </div>
          </fieldset>

          {/* Plan de tratamiento */}
          <fieldset className="space-y-3">
            <SectionTitle>Plan de tratamiento</SectionTitle>
            <div className="space-y-1.5">
              <Label htmlFor="endo-plan">Plan</Label>
              <Textarea
                id="endo-plan"
                rows={2}
                value={form.treatment_plan}
                onChange={(e) => set('treatment_plan', e.target.value)}
                placeholder="Tratamiento de conductos en 2 sesiones, corona posterior…"
              />
            </div>
          </fieldset>

          {/* Bitácora del tratamiento */}
          <fieldset className="space-y-3">
            <SectionTitle>Bitácora del tratamiento</SectionTitle>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Registra con fecha lo que se realiza en cada sesión.
            </p>

            {sortedLog.length > 0 ? (
              <ol className="relative space-y-2 border-l border-border pl-4">
                {sortedLog.map((entry) => {
                  const realIndex = log.indexOf(entry)
                  return (
                    <li key={`${entry.date}-${realIndex}`} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground">
                            {new Date(entry.date + 'T00:00:00').toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {entry.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLogEntry(realIndex)}
                          className="text-muted-foreground hover:text-destructive p-1 -mr-1 shrink-0"
                          aria-label="Quitar entrada"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">Aún no hay entradas en la bitácora.</p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 rounded-lg border bg-muted/20 p-3">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="sm:w-40"
                aria-label="Fecha de la entrada"
              />
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLogEntry()
                  }
                }}
                placeholder="Ej. Apertura y conductometría · obturación con gutapercha…"
                className="flex-1"
                maxLength={500}
              />
              <Button type="button" variant="outline" onClick={addLogEntry}>
                <Plus className="size-4" /> Agregar
              </Button>
            </div>
          </fieldset>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSubmit} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isEdit ? 'Guardar cambios' : 'Crear registro'}
          </Button>
        </DialogFooter>
    </>
  )
}
