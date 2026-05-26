import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelMembership,
  createMembership,
  createMembershipPlan,
  deleteMembershipPlan,
  getCurrentMembershipForPatient,
  getMembershipPlan,
  listMembershipPlans,
  listMemberships,
  updateMembershipPlan,
  type CreateMembershipPayload,
  type MembershipListQuery,
  type MembershipPlanPayload,
} from './api'

const plansKey = ['membership-plans'] as const
const planKey = (id: number) => ['membership-plans', id] as const
const membershipsKey = (q: MembershipListQuery) => ['memberships', q] as const
const patientMembershipKey = (id: number) =>
  ['patients', id, 'membership'] as const

export function useMembershipPlans(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: [...plansKey, params],
    queryFn: () => listMembershipPlans(params),
    staleTime: 60_000,
  })
}

export function useMembershipPlan(id: number | undefined) {
  return useQuery({
    queryKey: id ? planKey(id) : ['membership-plans', 'none'],
    queryFn: () => getMembershipPlan(id as number),
    enabled: !!id,
  })
}

export function useCreateMembershipPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: MembershipPlanPayload) => createMembershipPlan(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey })
    },
  })
}

export function useUpdateMembershipPlan(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<MembershipPlanPayload>) =>
      updateMembershipPlan(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey })
      qc.invalidateQueries({ queryKey: planKey(id) })
    },
  })
}

export function useDeleteMembershipPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMembershipPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: plansKey })
    },
  })
}

export function useMemberships(query: MembershipListQuery = {}) {
  return useQuery({
    queryKey: membershipsKey(query),
    queryFn: () => listMemberships(query),
    staleTime: 30_000,
  })
}

export function useCreateMembership() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMembershipPayload) => createMembership(payload),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['memberships'] })
      qc.invalidateQueries({ queryKey: patientMembershipKey(m.patient_id) })
      qc.invalidateQueries({ queryKey: ['charges'] })
    },
  })
}

export function useCancelMembership() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelMembership(id),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ['memberships'] })
      qc.invalidateQueries({ queryKey: patientMembershipKey(m.patient_id) })
    },
  })
}

export function useCurrentPatientMembership(patientId: number | undefined) {
  return useQuery({
    queryKey: patientId
      ? patientMembershipKey(patientId)
      : ['patients', 'none', 'membership'],
    queryFn: () => getCurrentMembershipForPatient(patientId as number),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}
