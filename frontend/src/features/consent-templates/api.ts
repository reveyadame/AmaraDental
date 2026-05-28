import { api } from '@/shared/api/client'
import type { ApiEnvelope } from '@/shared/types/api'
import type { ConsentTemplate } from '@/shared/types/patient'

export interface ConsentTemplatePayload {
  title: string
  body: string
  treatment_type: string | null
  active: boolean
}

/** Lista todas las plantillas (incluye inactivas) para el catálogo admin. */
export async function listAllConsentTemplates(): Promise<ConsentTemplate[]> {
  const { data } = await api.get<{ data: ConsentTemplate[] }>('/api/consent-templates', {
    params: { only_active: false },
  })
  return data.data
}

export async function createConsentTemplate(
  payload: ConsentTemplatePayload,
): Promise<ConsentTemplate> {
  const { data } = await api.post<ApiEnvelope<ConsentTemplate>>(
    '/api/consent-templates',
    payload,
  )
  return data.data
}

export async function updateConsentTemplate(
  id: number,
  payload: ConsentTemplatePayload,
): Promise<ConsentTemplate> {
  const { data } = await api.put<ApiEnvelope<ConsentTemplate>>(
    `/api/consent-templates/${id}`,
    payload,
  )
  return data.data
}

export async function deleteConsentTemplate(id: number): Promise<void> {
  await api.delete(`/api/consent-templates/${id}`)
}
