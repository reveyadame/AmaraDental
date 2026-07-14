import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'

export interface Subscription {
  plan: string | null
  plan_key: string | null
  max_patients: number | null // null = ilimitado
  patients_count: number
  can_add_patients: boolean
}

export async function getSubscription(): Promise<Subscription> {
  const { data } = await api.get<ApiEnvelope<Subscription>>('/api/subscription')
  return data.data
}
