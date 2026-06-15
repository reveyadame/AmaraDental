import { useEffect } from 'react'

/**
 * Auto-dispara `window.print()` un instante después de que los datos estén
 * listos. Usado por las páginas `Print*` para guardar como PDF o imprimir
 * directo. El pequeño retraso da tiempo a que el layout y las fuentes pinten.
 *
 * @param ready  true cuando la data necesaria ya cargó (el print debe esperar).
 * @param delayMs retraso antes de imprimir (default 350 ms).
 */
export function usePrintOnLoad(ready: boolean, delayMs = 350): void {
  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => window.print(), delayMs)
    return () => window.clearTimeout(t)
  }, [ready, delayMs])
}
