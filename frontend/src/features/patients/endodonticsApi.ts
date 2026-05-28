import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  EndodonticRecord,
  EndodonticRecordPayload,
} from '@/shared/types/endodontics'

export async function listEndodonticRecords(
  patientId: number,
): Promise<EndodonticRecord[]> {
  const { data } = await api.get<{ data: EndodonticRecord[] }>(
    `/api/patients/${patientId}/endodontic-records`,
  )
  return data.data
}

export async function createEndodonticRecord(
  patientId: number,
  payload: EndodonticRecordPayload,
): Promise<EndodonticRecord> {
  const { data } = await api.post<ApiEnvelope<EndodonticRecord>>(
    `/api/patients/${patientId}/endodontic-records`,
    payload,
  )
  return data.data
}

export async function updateEndodonticRecord(
  patientId: number,
  recordId: number,
  payload: EndodonticRecordPayload,
): Promise<EndodonticRecord> {
  const { data } = await api.put<ApiEnvelope<EndodonticRecord>>(
    `/api/patients/${patientId}/endodontic-records/${recordId}`,
    payload,
  )
  return data.data
}

export async function deleteEndodonticRecord(
  patientId: number,
  recordId: number,
): Promise<void> {
  await api.delete(`/api/patients/${patientId}/endodontic-records/${recordId}`)
}
