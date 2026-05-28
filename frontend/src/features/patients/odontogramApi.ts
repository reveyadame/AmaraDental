import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  CreateTreatmentLogPayload,
  OdontogramResponse,
  ToothState,
  TreatmentLogEntry,
  UpdateToothStatePayload,
} from '@/shared/types/odontogram'

export async function getOdontogram(patientId: number): Promise<OdontogramResponse> {
  const { data } = await api.get<OdontogramResponse>(
    `/api/patients/${patientId}/odontogram`,
  )
  return data
}

export async function updateTooth(
  patientId: number,
  toothNumber: number,
  payload: UpdateToothStatePayload,
): Promise<ToothState> {
  const { data } = await api.put<ApiEnvelope<ToothState>>(
    `/api/patients/${patientId}/odontogram/${toothNumber}`,
    payload,
  )
  return data.data
}

export async function updateOdontogramDiagnosis(
  patientId: number,
  diagnosis: string | null,
): Promise<string | null> {
  const { data } = await api.put<{ data: { general_diagnosis: string | null } }>(
    `/api/patients/${patientId}/odontogram-diagnosis`,
    { diagnosis },
  )
  return data.data.general_diagnosis
}

export async function getTreatmentLog(
  patientId: number,
): Promise<TreatmentLogEntry[]> {
  const { data } = await api.get<{ data: TreatmentLogEntry[] }>(
    `/api/patients/${patientId}/treatment-log`,
  )
  return data.data
}

export async function addTreatmentLogEntry(
  patientId: number,
  payload: CreateTreatmentLogPayload,
): Promise<TreatmentLogEntry> {
  const { data } = await api.post<ApiEnvelope<TreatmentLogEntry>>(
    `/api/patients/${patientId}/treatment-log`,
    payload,
  )
  return data.data
}

export async function deleteTreatmentLogEntry(
  patientId: number,
  entryId: number,
): Promise<void> {
  await api.delete(`/api/patients/${patientId}/treatment-log/${entryId}`)
}
