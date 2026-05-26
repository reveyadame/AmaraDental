import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type {
  OdontogramResponse,
  ToothState,
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
