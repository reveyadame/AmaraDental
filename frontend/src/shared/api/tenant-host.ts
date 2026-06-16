/**
 * Deriva el slug de la clínica a partir del subdominio del frontend, para
 * mandarlo como `X-Tenant` al API (que vive en otro host, api.amaradental.mx).
 *
 * Requiere `VITE_CENTRAL_DOMAIN` (ej. `amaradental.mx`) en el build de prod.
 * En dev (sin esa var, o en localhost) devuelve null → el API usa el tenant por
 * defecto, igual que hoy.
 */
const RESERVED = ['www', 'app', 'api', 'admin', 'static', 'assets', 'cdn', 'mail']

export function tenantSlugFromHost(): string | null {
  const central = import.meta.env.VITE_CENTRAL_DOMAIN
  if (!central) return null

  const host = window.location.hostname.toLowerCase()
  if (host === central || !host.endsWith('.' + central)) return null

  const sub = host.slice(0, -(central.length + 1)).split('.')[0]
  return sub && !RESERVED.includes(sub) ? sub : null
}

/**
 * True cuando el frontend se sirve en `admin.<central>` (panel super-admin).
 * En ese host la app monta la plataforma en la raíz, no la app de clínica.
 * En dev (sin VITE_CENTRAL_DOMAIN) siempre es false → la plataforma vive en
 * la ruta `/plataforma`.
 */
export function isPlatformHost(): boolean {
  const central = import.meta.env.VITE_CENTRAL_DOMAIN
  if (!central) return false

  return window.location.hostname.toLowerCase() === 'admin.' + central
}

/**
 * True cuando el frontend se sirve en el apex (`amaradental.mx`) o `www`:
 * ahí va la landing pública con el alta self-service, no la app de clínica.
 * En dev (sin VITE_CENTRAL_DOMAIN) es false.
 */
export function isLandingHost(): boolean {
  const central = import.meta.env.VITE_CENTRAL_DOMAIN
  if (!central) return false

  const host = window.location.hostname.toLowerCase()
  return host === central || host === 'www.' + central
}
