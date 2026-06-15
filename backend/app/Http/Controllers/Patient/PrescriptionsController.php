<?php

declare(strict_types=1);

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\PatientAccount;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Recetas del paciente autenticado (solo lectura).
 */
class PrescriptionsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var PatientAccount $account */
        $account = $request->user();

        $prescriptions = Prescription::query()
            ->where('patient_id', $account->patient_id)
            ->with(['specialist', 'items'])
            ->orderByDesc('issued_at')
            ->get()
            ->map(fn (Prescription $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'diagnosis' => $p->diagnosis,
                'notes' => $p->notes,
                'issued_at' => $p->issued_at?->toIso8601String(),
                'specialist_name' => $p->specialist?->name,
                'items' => $p->items->map(fn ($i) => [
                    'medication' => $i->medication,
                    'presentation' => $i->presentation,
                    'dosage' => $i->dosage,
                    'frequency' => $i->frequency,
                    'duration' => $i->duration,
                    'instructions' => $i->instructions,
                ])->values(),
            ]);

        return response()->json(['data' => $prescriptions]);
    }
}
