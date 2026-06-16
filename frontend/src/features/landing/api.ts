import { publicApi } from '@/shared/api/public-client'

export interface PublicPlan {
  key: string
  name: string
  max_patients: number | null
  includes_app: boolean
  price_mxn: number | null
}

export async function getPublicPlans(): Promise<PublicPlan[]> {
  const { data } = await publicApi.get<{ data: PublicPlan[] }>('/api/public/plans')
  return data.data
}

export interface SlugStatus {
  slug: string
  available: boolean
  reason: string | null
}

export async function checkSlug(slug: string): Promise<SlugStatus> {
  const { data } = await publicApi.get<SlugStatus>('/api/public/slug-available', {
    params: { slug },
  })
  return data
}

export interface SignupPayload {
  clinic_name: string
  admin_name?: string
  admin_email: string
  slug: string
  plan_key?: string
}

export interface SignupResult {
  slug: string
  app_url: string
  admin_email: string
  trial_ends_at: string | null
}

export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const { data } = await publicApi.post<{ data: SignupResult }>('/api/public/signup', payload)
  return data.data
}
