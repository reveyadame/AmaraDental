import { api } from '@/shared/api/client'
import type { ApiEnvelope, User } from '@/shared/types/api'

interface PaginatedMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface UserListQuery {
  q?: string
  page?: number
  per_page?: number
}

export interface UserPayload {
  name: string
  email: string
  phone?: string | null
  password?: string
  active?: boolean
  roles: string[]
  cedula_profesional?: string | null
  specialty?: string | null
  default_commission_percent?: number | null
  bio?: string | null
}

export async function listUsers(query: UserListQuery = {}): Promise<{
  data: User[]
  meta: PaginatedMeta
}> {
  const { data } = await api.get<{ data: User[]; meta: PaginatedMeta }>(
    '/api/users',
    { params: query },
  )
  return data
}

export async function createUser(payload: UserPayload): Promise<User> {
  const { data } = await api.post<ApiEnvelope<User>>('/api/users', payload)
  return data.data
}

export async function updateUser(
  id: number,
  payload: Partial<UserPayload>,
): Promise<User> {
  const { data } = await api.put<ApiEnvelope<User>>(`/api/users/${id}`, payload)
  return data.data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/users/${id}`)
}
