<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ChargeItem;
use App\Models\ChargePayment;
use App\Models\CommissionPayment;
use App\Models\PatientCredit;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

/**
 * Eliminación de pagos individuales (ingresos) capturados por error.
 *
 * Solo admin. La sesión de caja debe seguir abierta — los cortes cerrados
 * son inmutables. Si hay comisiones liquidadas en el cobro afectado, el
 * endpoint devuelve 409 con la lista de dependencias y requiere `force=1`
 * para deshacerlas en cascada.
 */
class ChargePaymentsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function destroy(Request $request, ChargePayment $payment): JsonResponse
    {
        $this->requireAdmin('Solo el administrador puede eliminar pagos.');

        $session = $payment->cashSession;
        abort_if(
            $session && $session->status === 'closed',
            422,
            'No se puede eliminar un pago de un corte ya cerrado.',
        );

        $force = (bool) $request->boolean('force');

        // Detectamos las comisiones ya liquidadas en items del mismo cobro.
        $items = ChargeItem::query()
            ->where('charge_id', $payment->charge_id)
            ->whereNotNull('commission_payment_id')
            ->with('commissionPayment.specialist')
            ->get();

        $commissionPayments = $items
            ->pluck('commissionPayment')
            ->filter()
            ->unique('id')
            ->values();

        $hasDependencies = $commissionPayments->isNotEmpty();

        if ($hasDependencies && ! $force) {
            return response()->json([
                'message' => 'El pago tiene dependencias. Confirma para eliminarlo en cascada.',
                'dependencies' => [
                    'commission_payments' => $commissionPayments->map(fn ($cp) => [
                        'id' => $cp->id,
                        'specialist_name' => $cp->specialist?->name,
                        'amount' => (float) $cp->amount,
                        'paid_at' => $cp->paid_at?->toIso8601String(),
                    ])->values(),
                    'items_count' => $items->count(),
                ],
            ], 409);
        }

        DB::transaction(function () use ($payment, $items, $commissionPayments, $request): void {
            // 1. Si admin confirmó, liberar items y eliminar commission_payments
            //    (con sus cash_expense asociados si los hay).
            foreach ($commissionPayments as $cp) {
                ChargeItem::query()
                    ->where('commission_payment_id', $cp->id)
                    ->update(['commission_payment_id' => null]);
                if ($cp->cashExpense
                    && $cp->cashExpense->cashSession?->status === 'open') {
                    $cp->cashExpense->delete();
                }
                $cp->delete();
            }

            // 2. Si el pago fue con saldo a favor, regresar ese saldo al
            //    paciente registrando un movimiento contrario.
            if ($payment->method === 'credit') {
                PatientCredit::query()->create([
                    'tenant_id' => TenantContext::tenantId(),
                    'patient_id' => $payment->charge?->patient_id,
                    'amount' => (float) $payment->amount,
                    'source' => 'refund_application',
                    'charge_id' => $payment->charge_id,
                    'notes' => 'Reverso por eliminación de pago con saldo a favor',
                    'created_by_user_id' => $request->user()->id,
                ]);
            }

            // 3. Eliminar el pago y recomputar el cobro.
            $charge = $payment->charge;
            $payment->delete();
            if ($charge) {
                $charge->recomputeTotals();
                $charge->save();
            }
        });

        return response()->json(['message' => 'OK']);
    }
}
