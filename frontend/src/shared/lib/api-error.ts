/**
 * Helpers para extraer errores de respuestas del API (formato Laravel).
 *
 * Laravel responde los errores de validación como:
 *   { message: string, errors: { campo: string[] } }   // 422
 * y otros errores como:
 *   { message: string }                                  // 4xx/5xx
 *
 * Estos helpers reemplazan el patrón duck-typed que estaba copiado inline en
 * decenas de form dialogs. No importan axios a propósito: funcionan con
 * cualquier error con forma `{ response: { data } }` y degradan con gracia.
 */

type ApiErrorData = {
  message?: string
  errors?: Record<string, string[]>
}

/** Extrae el cuerpo `data` de la respuesta del error, si existe. */
function getApiErrorData(error: unknown): ApiErrorData | undefined {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: ApiErrorData } }).response
    return response?.data
  }
  return undefined
}

/**
 * Mensaje legible para mostrar al usuario: primer error de validación, si no
 * el `message` del backend, y si no el `fallback` provisto.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  const data = getApiErrorData(error)
  const firstFieldError = data?.errors
    ? Object.values(data.errors)[0]?.[0]
    : undefined
  return firstFieldError ?? data?.message ?? fallback
}

/**
 * Mapa de errores por campo (`{ campo: mensaje }`) para volcarlos a un form.
 * Toma el primer mensaje de cada campo. Vacío si no hay errores de validación.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  const errors = getApiErrorData(error)?.errors
  if (!errors) return {}
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(errors)) {
    const first = messages[0]
    if (first) result[field] = first
  }
  return result
}
