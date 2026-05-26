import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useBranding as useBrandingQuery } from '@/features/auth/hooks'
import { inferForeground } from '@/shared/lib/image'
import { getFont } from '@/shared/theme/fonts'
import type { Branding } from '@/shared/types/api'

interface ThemeContextValue {
  branding: Branding | undefined
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyBrandingToDocument(b: Branding) {
  const styleId = 'tenant-theme'
  let style = document.getElementById(styleId) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }

  const sidebarBg = b.color_sidebar?.trim()
  const sidebarFg = sidebarBg ? inferForeground(sidebarBg) : ''
  const accent = b.color_accent?.trim()
  const accentFg = accent ? inferForeground(accent) : ''
  const font = getFont(b.font_family)

  // Solo escribimos las variables que el tenant haya personalizado, así el
  // resto cae a los defaults de index.css.
  const rules: string[] = [
    `--primary: ${b.color_primary};`,
    `--primary-foreground: ${b.color_primary_foreground};`,
    `--secondary: ${b.color_secondary};`,
    `--font-sans: ${font.css};`,
  ]
  if (sidebarBg) {
    rules.push(`--sidebar-bg: ${sidebarBg};`)
    rules.push(`--sidebar-fg: ${sidebarFg};`)
    rules.push(`--sidebar-fg-muted: color-mix(in srgb, ${sidebarFg} 65%, ${sidebarBg});`)
  }
  if (accent) {
    rules.push(`--accent: ${accent};`)
    rules.push(`--accent-foreground: ${accentFg};`)
    // También exponemos como `--brand-accent` para usos directos en CSS.
    rules.push(`--brand-accent: ${accent};`)
  }

  style.textContent =
    `:root {\n${rules.map((r) => '  ' + r).join('\n')}\n}\n` +
    // Fuerza también el body por si index.css ya se aplicó antes.
    `body { font-family: ${font.css}; }`
  document.title = b.brand_name

  // Carga la fuente de Google si aplica. Solo una hoja viva a la vez.
  const linkId = 'tenant-font'
  const existing = document.getElementById(linkId) as HTMLLinkElement | null
  if (font.google) {
    const href =
      `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`
    if (!existing) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    } else if (existing.href !== href) {
      existing.href = href
    }
  } else if (existing) {
    existing.remove()
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const query = useBrandingQuery()

  useEffect(() => {
    if (query.data) applyBrandingToDocument(query.data)
  }, [query.data])

  return (
    <ThemeContext.Provider value={{ branding: query.data, isLoading: query.isPending }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useBranding(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useBranding debe usarse dentro de <ThemeProvider>')
  return ctx
}
