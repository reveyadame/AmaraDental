import axios, { AxiosError } from 'axios'
import { apiBaseURL } from './base-url'
import { tenantSlugFromHost } from './tenant-host'

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Cuando el API vive en otro host (api.amaradental.mx) y el frontend en el
// subdominio de la clínica, le decimos al API qué clínica es vía X-Tenant.
api.interceptors.request.use((config) => {
  const slug = tenantSlugFromHost()
  if (slug) {
    config.headers.set('X-Tenant', slug)
  }
  return config
})

/**
 * Llamar UNA vez antes de cualquier petición autenticada para que Sanctum
 * deposite la cookie XSRF-TOKEN. Idempotente.
 */
let csrfReady: Promise<void> | null = null
export function ensureCsrf(): Promise<void> {
  if (!csrfReady) {
    csrfReady = api.get('/sanctum/csrf-cookie').then(() => undefined)
  }
  return csrfReady
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      // Token/sesión inválida — el router debe redirigir a /login.
      window.dispatchEvent(new CustomEvent('auth:unauthenticated'))
    }
    return Promise.reject(error)
  },
)
