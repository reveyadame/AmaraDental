<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;

/**
 * Catálogo de planes para el panel de plataforma (selector al crear/editar
 * clínicas).
 */
class PlansController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()->orderBy('sort_order')->get();

        return response()->json([
            'data' => $plans->map(fn (Plan $p) => [
                'key' => $p->key,
                'name' => $p->name,
                'max_patients' => $p->max_patients,
                'includes_app' => $p->includes_app,
            ])->values(),
        ]);
    }
}
