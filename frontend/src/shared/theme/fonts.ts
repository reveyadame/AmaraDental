import type { FontFamilyKey } from '@/shared/types/api'

interface FontOption {
  key: FontFamilyKey
  label: string
  /** Familia CSS completa con fallbacks — se inyecta en `--font-sans`. */
  css: string
  /**
   * Param `family` que Google Fonts entiende (ej. `Inter:wght@400;500;600;700`).
   * Si es null, no se carga nada externo (system stack o Inter ya local).
   */
  google: string | null
  /** Categoría para agruparlas en el selector. */
  group: 'sans' | 'serif' | 'system'
}

const SYSTEM_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    key: 'inter',
    label: 'Inter (por defecto)',
    css: `'Inter', ${SYSTEM_STACK}`,
    google: 'Inter:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'roboto',
    label: 'Roboto',
    css: `'Roboto', ${SYSTEM_STACK}`,
    google: 'Roboto:wght@400;500;700',
    group: 'sans',
  },
  {
    key: 'open_sans',
    label: 'Open Sans',
    css: `'Open Sans', ${SYSTEM_STACK}`,
    google: 'Open+Sans:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'lato',
    label: 'Lato',
    css: `'Lato', ${SYSTEM_STACK}`,
    google: 'Lato:wght@400;700',
    group: 'sans',
  },
  {
    key: 'poppins',
    label: 'Poppins',
    css: `'Poppins', ${SYSTEM_STACK}`,
    google: 'Poppins:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'montserrat',
    label: 'Montserrat',
    css: `'Montserrat', ${SYSTEM_STACK}`,
    google: 'Montserrat:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'nunito',
    label: 'Nunito',
    css: `'Nunito', ${SYSTEM_STACK}`,
    google: 'Nunito:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'source_sans_3',
    label: 'Source Sans 3',
    css: `'Source Sans 3', ${SYSTEM_STACK}`,
    google: 'Source+Sans+3:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'work_sans',
    label: 'Work Sans',
    css: `'Work Sans', ${SYSTEM_STACK}`,
    google: 'Work+Sans:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'plus_jakarta_sans',
    label: 'Plus Jakarta Sans',
    css: `'Plus Jakarta Sans', ${SYSTEM_STACK}`,
    google: 'Plus+Jakarta+Sans:wght@400;500;600;700',
    group: 'sans',
  },
  {
    key: 'dm_sans',
    label: 'DM Sans',
    css: `'DM Sans', ${SYSTEM_STACK}`,
    google: 'DM+Sans:wght@400;500;700',
    group: 'sans',
  },
  {
    key: 'merriweather',
    label: 'Merriweather (serif)',
    css: `'Merriweather', Georgia, 'Times New Roman', serif`,
    google: 'Merriweather:wght@400;700',
    group: 'serif',
  },
  {
    key: 'lora',
    label: 'Lora (serif)',
    css: `'Lora', Georgia, 'Times New Roman', serif`,
    google: 'Lora:wght@400;500;600;700',
    group: 'serif',
  },
  {
    key: 'system',
    label: 'Sistema (sin descargar)',
    css: SYSTEM_STACK,
    google: null,
    group: 'system',
  },
] as const

export function getFont(key: FontFamilyKey | null | undefined): FontOption {
  return FONT_OPTIONS.find((f) => f.key === key) ?? FONT_OPTIONS[0]!
}
