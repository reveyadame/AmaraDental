/**
 * Tipos compartidos del API. En el futuro generaremos esto desde OpenAPI
 * (openapi-typescript) para mantenerlo sincronizado con el backend.
 */

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  active: boolean
  /** Roles asignados al usuario. Sin roles = sin acceso. */
  roles: Role[]
  /** Permisos efectivos del usuario — vienen únicamente de los roles. */
  permissions: Permission[]
  created_at: string | null
}

/** Catálogo de especialistas (no son usuarios del sistema). */
export interface Specialist {
  id: number
  name: string
  specialty: string | null
  cedula_profesional: string | null
  default_commission_percent: number | null
  bio: string | null
  active: boolean
  created_at: string | null
}

export interface Branding {
  brand_name: string
  logo_url: string | null
  color_primary: string
  color_primary_foreground: string
  color_secondary: string
  color_sidebar?: string | null
  // Colores finos del menú lateral. Si quedan nulos, la UI deriva del tema.
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

  // Preferencias para tickets de pago (impresora térmica).
  ticket_width?: '58mm' | '80mm'
  ticket_show_logo?: boolean
  ticket_show_address?: boolean
  ticket_show_cedulas?: boolean
  ticket_footer_message?: string | null
  ticket_auto_print?: boolean

  // Preferencias para impresión de recetas.
  prescription_paper_size?:
    | 'letter'
    | 'letter_landscape'
    | 'half_letter'
    | 'half_letter_landscape'
  prescription_mode?: 'design' | 'preprinted'
  prescription_background_url?: string | null
  prescription_margin_top_mm?: number
  prescription_layout?: 'standard' | 'compact'

  // Tipografía global de la app.
  font_family?: FontFamilyKey
}

export type FontFamilyKey =
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

export interface ApiEnvelope<T> {
  data: T
}

/**
 * Roles del sistema (uno por módulo + Administrador). Sin roles = sin permisos.
 * El rol Administrador agrega además acciones "de superior" (cancelar cobros
 * y pagos, eliminar movimientos, eliminar recetas) y gestión del sistema
 * (usuarios, bitácora, configuración).
 */
export type Role =
  | 'admin'
  | 'agenda'
  | 'pacientes'
  | 'catalogos'
  | 'caja'
  | 'cotizaciones'
  | 'pago_comisiones'
  | 'membresias'
  | 'laboratorios'
  | 'recalls'
  | 'reportes'

/** Permisos discretos del catálogo backend (`App\Support\Permissions`). */
export type Permission =
  | 'appointments.manage'
  | 'agenda_blocks.manage'
  | 'patients.read_basic'
  | 'patients.manage'
  | 'patients.delete'
  | 'clinical.view'
  | 'clinical.manage'
  | 'prescriptions.create'
  | 'prescriptions.delete'
  | 'catalogs.manage'
  | 'cash.operate'
  | 'cash.delete_movements'
  | 'charges.create'
  | 'charges.cancel'
  | 'quotes.manage'
  | 'commissions.manage'
  | 'memberships.manage'
  | 'labs.manage'
  | 'recalls.manage'
  | 'reports.view'
  | 'audit.view'
  | 'users.manage'
  | 'branding.manage'
