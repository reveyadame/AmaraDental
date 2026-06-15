<?php

declare(strict_types=1);

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Charge;
use App\Models\PatientAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Estado de cuenta del paciente autenticado (solo lectura): totales y cobros
 * no cancelados. Acotado a su propio patient_id (además del scope de tenant).
 */
class AccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();
        $patient = $account->patient;

        $charges = Charge::query()
            ->where('patient_id', $account->patient_id)
            ->where('status', '!=', 'cancelled')
            ->with('items')
            ->orderByDesc('created_at')
            ->get();

        $totals = [
            'invoiced' => round((float) $charges->sum('total'), 2),
            'paid' => round((float) $charges->sum('paid_total'), 2),
            'balance' => round((float) $charges->sum('balance'), 2),
            'credit_balance' => round($patient->creditBalance(), 2),
        ];

        return response()->json([
            'data' => [
                'totals' => $totals,
                'charges' => $charges->map(fn (Charge $c) => [
                    'id' => $c->id,
                    'code' => $c->code,
                    'status' => $c->status,
                    'total' => (float) $c->total,
                    'paid_total' => (float) $c->paid_total,
                    'balance' => (float) $c->balance,
                    'created_at' => $c->created_at?->toIso8601String(),
                    'items' => $c->items->map(fn ($i) => [
                        'treatment_name' => $i->treatment_name,
                        'quantity' => (int) $i->quantity,
                        'line_total' => (float) $i->line_total,
                    ])->values(),
                ])->values(),
            ],
        ]);
    }
}
