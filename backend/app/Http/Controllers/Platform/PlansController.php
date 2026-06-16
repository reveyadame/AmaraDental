<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Catálogo de planes para el panel de plataforma: selector al crear/editar
 * clínicas y configuración de los planes (nombre, límite, app, precio, Stripe).
 *
 * Los 3 planes son fijos (no se crean ni borran desde aquí): solo se editan sus
 * atributos. Stripe sigue siendo la fuente de verdad del cobro vía stripe_price_id.
 */
class PlansController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()->orderBy('sort_order')->get();

        return response()->json([
            'data' => $plans->map(fn (Plan $p) => $this->serialize($p))->values(),
        ]);
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            // null = ilimitado. Entero positivo si se especifica.
            'max_patients' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:1000000'],
            'includes_app' => ['sometimes', 'boolean'],
            'price_mxn' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000000'],
            'stripe_price_id' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $plan->fill($data)->save();

        return response()->json(['data' => $this->serialize($plan->refresh())]);
    }

    /** @return array<string, mixed> */
    private function serialize(Plan $plan): array
    {
        return [
            'id' => $plan->id,
            'key' => $plan->key,
            'name' => $plan->name,
            'max_patients' => $plan->max_patients,
            'includes_app' => $plan->includes_app,
            'price_mxn' => $plan->price_mxn,
            'stripe_price_id' => $plan->stripe_price_id,
            // ¿Listo para cobrar? (tiene price configurado en Stripe).
            'stripe_ready' => filled($plan->stripe_price_id),
            'tenants_count' => $plan->tenants()->count(),
        ];
    }
}
