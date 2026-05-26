import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type UserListQuery,
  type UserPayload,
} from './api'

const listKey = (q: UserListQuery) => ['users', 'list', q] as const

export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: listKey(query),
    queryFn: () => listUsers(query),
    staleTime: 30_000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: UserPayload) => createUser(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: Partial<UserPayload>) => updateUser(id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
