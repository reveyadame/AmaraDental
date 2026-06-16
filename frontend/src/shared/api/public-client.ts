import axios from 'axios'
import { apiBaseURL } from './base-url'

/**
 * Cliente HTTP para los endpoints públicos de la landing (apex amaradental.mx):
 * alta self-service y precios. Sin cookies ni X-Tenant — opera por encima de
 * los tenants.
 */
export const publicApi = axios.create({
  baseURL: apiBaseURL,
  headers: { Accept: 'application/json' },
})
