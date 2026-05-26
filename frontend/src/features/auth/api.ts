import { api, ensureCsrf } from '@/shared/api/client'
import type { ApiEnvelope, Branding, User } from '@/shared/types/api'

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export async function login(payload: LoginPayload): Promise<User> {
  await ensureCsrf()
  const { data } = await api.post<ApiEnvelope<User>>('/api/auth/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout')
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<ApiEnvelope<User>>('/api/me')
  return data.data
}

export async function fetchBranding(): Promise<Branding> {
  const { data } = await api.get<ApiEnvelope<Branding>>('/api/branding')
  return data.data
}
