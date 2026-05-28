import { api } from '@/shared/api/client'
import type { ApiEnvelope, Branding } from '@/shared/types/api'

export interface BrandingUpdatePayload {
  brand_name?: string
  logo_url?: string | null
  color_primary?: string
  color_primary_foreground?: string
  color_secondary?: string
  color_sidebar?: string | null
  sidebar_item_bg?: string | null
  sidebar_item_color?: string | null
  sidebar_hover_bg?: string | null
  sidebar_active_bg?: string | null
  sidebar_active_color?: string | null
  color_header?: string | null
  color_accent?: string | null
  razon_social?: string | null
  rfc?: string | null
  address?: string | null
  phones?: string[]
  cedulas_clinica?: string[]
  timezone?: string
  ticket_width?: '58mm' | '80mm' | null
  ticket_show_logo?: boolean
  ticket_show_address?: boolean
  ticket_show_cedulas?: boolean
  ticket_footer_message?: string | null
  ticket_auto_print?: boolean
  prescription_paper_size?:
    | 'letter'
    | 'letter_landscape'
    | 'half_letter'
    | 'half_letter_landscape'
    | null
  prescription_mode?: 'design' | 'preprinted' | null
  prescription_background_url?: string | null
  prescription_margin_top_mm?: number | null
  prescription_layout?: 'standard' | 'compact' | null
  font_family?:
    | 'inter'
    | 'roboto'
    | 'open_sans'
    | 'lato'
    | 'poppins'
    | 'montserrat'
    | 'nunito'
    | 'source_sans_3'
    | 'work_sans'
    | 'plus_jakarta_sans'
    | 'dm_sans'
    | 'merriweather'
    | 'lora'
    | 'system'
    | null
}

export async function updateBranding(payload: BrandingUpdatePayload): Promise<Branding> {
  const { data } = await api.put<ApiEnvelope<Branding>>('/api/branding', payload)
  return data.data
}
