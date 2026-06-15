import axios, { AxiosError } from 'axios'
import { apiBaseURL } from './base-url'

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
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
