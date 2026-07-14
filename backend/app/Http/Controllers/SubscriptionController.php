<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

/**
 * Suscripción de la clínica autenticada: plan vigente y uso de pacientes. Lo
 * consume el frontend para mostrar uso y gatear el alta de pacientes.
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
            ],
        ]);
    }
}
