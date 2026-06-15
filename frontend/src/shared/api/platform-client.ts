import axios, { type AxiosError } from 'axios'
import { apiBaseURL } from './base-url'

/**
 * Cliente HTTP del panel de plataforma (super-admin). AISLADO del cliente de
 * clínica: usa token Bearer (no cookies de sesión), guardado en localStorage.
 */
const TOKEN_KEY = 'amara_platform_token'

export function getPlatformToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setPlatformToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const platformApi = axios.create({
  baseURL: apiBaseURL,
  headers: { Accept: 'application/json' },
})

platformApi.interceptors.request.use((config) => {
  const token = getPlatformToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

platformApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setPlatformToken(null)
      window.dispatchEvent(new CustomEvent('platform:unauthenticated'))
    }
    return Promise.reject(error)
  },
)
