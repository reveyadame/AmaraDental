/**
 * URL base del API, subdominio-aware:
 *  - **dev**: el backend en :8000 (override con `VITE_API_URL`).
 *  - **prod**: mismo origen (cadena vacía = rutas relativas). Así cada
 *    subdominio de clínica (`clinicax.amaradental.mx`) habla con su propio
 *    backend y el tenant se resuelve por el `Host`. Sin hosts hardcodeados.
 *
 * Si en producción el API vive en otro origen, basta con definir `VITE_API_URL`
 * al hacer el build.
 */
export const apiBaseURL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')
