import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateBranding, type BrandingUpdatePayload } from './api'

export function useUpdateBranding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: BrandingUpdatePayload) => updateBranding(p),
    onSuccess: (branding) => {
      // Refresca el ThemeProvider y demás consumers en vivo.
      qc.setQueryData(['branding'], branding)
      qc.invalidateQueries({ queryKey: ['branding'] })
    },
  })
}
