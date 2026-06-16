import { useMutation, useQuery } from '@tanstack/react-query'
import { getBilling, getBillingDetails, openPortal, startCheckout } from './api'

export function useBilling() {
  return useQuery({ queryKey: ['billing'], queryFn: getBilling, staleTime: 30_000 })
}

/** Detalle (renovación + facturas). Solo admin; hace llamadas a Stripe. */
export function useBillingDetails(enabled: boolean) {
  return useQuery({
    queryKey: ['billing', 'details'],
    queryFn: getBillingDetails,
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}

export function useCheckout() {
  return useMutation({ mutationFn: startCheckout })
}

export function usePortal() {
  return useMutation({ mutationFn: openPortal })
}
