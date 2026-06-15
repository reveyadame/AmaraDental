<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

/**
 * Suscripción de la clínica autenticada: plan vigente, uso de pacientes y
 * flags de módulos. Lo consume el frontend para mostrar uso y gatear UI.
 */
class SubscriptionController extends Controller
{
    public function show(): JsonResponse
    {
        $tenant = TenantContext::tenant();
        $plan = $tenant->plan;
        $max = $tenant->maxPatients();
        $count = Patient::query()->count();

        return response()->json([
            'data' => [
                'plan' => $plan?->name,
                'plan_key' => $plan?->key,
                'max_patients' => $max, // null = ilimitado
                'patients_count' => $count,
                'can_add_patients' => $max === null || $count < $max,
                'includes_app' => $tenant->includesApp(),
            ],
        ]);
    }
}
