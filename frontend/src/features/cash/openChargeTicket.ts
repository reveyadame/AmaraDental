/**
 * Abre el ticket de un cobro en una nueva ventana. Lo separamos en un helper
 * para que cualquier pantalla (NewChargePage, AddPaymentPage, dialogs) pueda
 * dispararlo igual sin duplicar el `window.open`.
 */
export function openChargeTicket(chargeId: number): void {
  window.open(`/caja/cobros/${chargeId}/ticket`, '_blank', 'noopener')
}
