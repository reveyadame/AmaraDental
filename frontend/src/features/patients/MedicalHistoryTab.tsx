import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save, ShieldAlert } from 'lucide-react'
import { useMedicalHistory, useUpdateMedicalHistory } from './hooks'
import { TagListInput } from './TagListInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import type { MedicalHistory } from '@/shared/types/patient'

const CHRONIC_SUGGEST = [
  'Hipertensión',
  'Diabetes tipo 2',
  'Asma',
  'Cardiopatía',
  'Anemia',
  'Hipotiroidismo',
  'Epilepsia',
]
const ALLERGY_SUGGEST = [
  'Penicilina',
  'AINEs',
  'Látex',
  'Anestésicos locales',
  'Sulfas',
  'Yodo',
]

interface DraftHistory extends Omit<MedicalHistory, 'updated_at' | 'updated_by_user_id' | 'id'> {}

function blank(patientId: number): DraftHistory {
  return {
    patient_id: patientId,
    chronic_conditions: [],
    allergies: [],
    current_medications: [],
    previous_surgeries: null,
    family_history: null,
    dental_history: null,
    last_dental_visit: null,
    pregnancy_status: null,
    smoker: null,
    alcohol_consumer: null,
    blood_pressure: null,
    heart_rate: null,
    temperature: null,
    weight_kg: null,
    height_cm: null,
    notes: null,
  }
}

export function MedicalHistoryTab({ patientId, isFemale }: { patientId: number; isFemale: boolean }) {
  const history = useMedicalHistory(patientId)
  const mutation = useUpdateMedicalHistory(patientId)
  const [draft, setDraft] = useState<DraftHistory>(blank(patientId))

  useEffect(() => {
    if (history.data) {
      const d = history.data
      setDraft({
        patient_id: d.patient_id,
        chronic_conditions: d.chronic_conditions ?? [],
        allergies: d.allergies ?? [],
        current_medications: d.current_medications ?? [],
        previous_surgeries: d.previous_surgeries ?? null,
        family_history: d.family_history ?? null,
        dental_history: d.dental_history ?? null,
        last_dental_visit: d.last_dental_visit ?? null,
        pregnancy_status: d.pregnancy_status ?? null,
        smoker: d.smoker ?? null,
        alcohol_consumer: d.alcohol_consumer ?? null,
        blood_pressure: d.blood_pressure ?? null,
        heart_rate: d.heart_rate ?? null,
        temperature: d.temperature ?? null,
        weight_kg: d.weight_kg ?? null,
        height_cm: d.height_cm ?? null,
        notes: d.notes ?? null,
      })
    }
  }, [history.data])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(draft, {
      onSuccess: () => toast.success('Historia clínica guardada'),
      onError: () => toast.error('No fue posible guardar'),
    })
  }

  if (history.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="size-4 text-destructive" />
            Alérgicos y crónicos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Alergias conocidas</Label>
            <TagListInput
              value={draft.allergies}
              onChange={(v) => setDraft({ ...draft, allergies: v })}
              placeholder="Penicilina"
              suggestions={ALLERGY_SUGGEST}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Padecimientos crónicos</Label>
            <TagListInput
              value={draft.chronic_conditions}
              onChange={(v) => setDraft({ ...draft, chronic_conditions: v })}
              placeholder="Hipertensión"
              suggestions={CHRONIC_SUGGEST}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Medicamentos actuales</Label>
            <TagListInput
              value={draft.current_medications}
              onChange={(v) => setDraft({ ...draft, current_medications: v })}
              placeholder="Losartán 50 mg cada 24 h"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antecedentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Cirugías previas</Label>
            <Textarea
              rows={2}
              value={draft.previous_surgeries ?? ''}
              onChange={(e) => setDraft({ ...draft, previous_surgeries: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Antecedentes familiares</Label>
            <Textarea
              rows={2}
              value={draft.family_history ?? ''}
              onChange={(e) => setDraft({ ...draft, family_history: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Antecedentes dentales</Label>
            <Textarea
              rows={2}
              value={draft.dental_history ?? ''}
              onChange={(e) => setDraft({ ...draft, dental_history: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <Label>Última visita dental</Label>
            <Input
              type="date"
              value={draft.last_dental_visit ?? ''}
              onChange={(e) => setDraft({ ...draft, last_dental_visit: e.target.value || null })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hábitos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          {isFemale ? (
            <div className="space-y-1.5">
              <Label>Estado de embarazo</Label>
              <Select
                value={draft.pregnancy_status ?? ''}
                onValueChange={(v) =>
                  setDraft({
                    ...draft,
                    pregnancy_status: (v as DraftHistory['pregnancy_status']) || null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No aplica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="si">Sí</SelectItem>
                  <SelectItem value="posible">Posible</SelectItem>
                  <SelectItem value="na">No aplica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>Fuma</Label>
            <Select
              value={draft.smoker === null ? '' : draft.smoker ? 'yes' : 'no'}
              onValueChange={(v) =>
                setDraft({ ...draft, smoker: v === '' ? null : v === 'yes' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin dato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Sí</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Consume alcohol</Label>
            <Select
              value={draft.alcohol_consumer === null ? '' : draft.alcohol_consumer ? 'yes' : 'no'}
              onValueChange={(v) =>
                setDraft({ ...draft, alcohol_consumer: v === '' ? null : v === 'yes' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin dato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Sí</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signos vitales (última toma)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Presión arterial</Label>
            <Input
              placeholder="120/80"
              value={draft.blood_pressure ?? ''}
              onChange={(e) => setDraft({ ...draft, blood_pressure: e.target.value || null })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>FC (lpm)</Label>
            <Input
              type="number"
              min={30}
              max={250}
              value={draft.heart_rate ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, heart_rate: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Temp (°C)</Label>
            <Input
              type="number"
              step="0.1"
              value={draft.temperature ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, temperature: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Peso (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={draft.weight_kg ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, weight_kg: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estatura (cm)</Label>
            <Input
              type="number"
              step="0.1"
              value={draft.height_cm ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, height_cm: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={draft.notes ?? ''}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value || null })}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar historia clínica
        </Button>
      </div>
    </form>
  )
}
