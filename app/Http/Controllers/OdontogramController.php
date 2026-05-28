<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Odontogram\UpdateToothStateRequest;
use App\Http\Resources\ToothStateResource;
use App\Models\Patient;
use App\Models\ToothState;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class OdontogramController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    /**
     * Devuelve los 32 dientes permanentes con su estado. Si un diente nunca
     * se ha tocado, regresa estado por defecto (todas las caras `healthy`,
     * `whole_state` null) — el frontend siempre recibe la dentadura completa.
     */
    public function index(Patient $patient): JsonResponse
    {
        $this->authorize('viewClinical', $patient);

        $stored = ToothState::query()
            ->with('updatedBy')
            ->where('patient_id', $patient->id)
            ->get()
            ->keyBy('tooth_number');

        $teeth = collect(ToothState::PERMANENT_TEETH)->map(function (int $number) use ($stored, $patient) {
            $existing = $stored->get($number);
            if ($existing) {
                return ToothStateResource::make($existing)->toArray(request());
            }

            return [
                'tooth_number' => $number,
                'dentition_type' => 'permanent',
                'whole_state' => null,
                'faces' => ToothState::defaultFaces(),
                'notes' => null,
                'updated_at' => null,
                'updated_by_user_id' => null,
                'updated_by_name' => null,
            ];
        });

        return response()->json([
            'data' => $teeth,
            'meta' => [
                'patient_id' => $patient->id,
                'dentition' => 'permanent',
                'general_diagnosis' => $patient->odontogram_diagnosis,
            ],
        ]);
    }

    /**
     * Diagnóstico general del odontograma (resumen clínico de la dentadura).
     * Se guarda en el paciente, auditado por su trait Auditable.
     */
    public function updateDiagnosis(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('updateClinical', $patient);

        $data = $request->validate([
            'diagnosis' => ['nullable', 'string', 'max:5000'],
        ]);

        $patient->odontogram_diagnosis = $data['diagnosis'] ?: null;
        $patient->save();

        return response()->json([
            'data' => ['general_diagnosis' => $patient->odontogram_diagnosis],
        ]);
    }

    /**
     * Upsert del estado de un diente concreto. Cada actualización queda
     * registrada en la bitácora (NOM-024) gracias al trait Auditable.
     */
    public function update(
        UpdateToothStateRequest $request,
        Patient $patient,
        int $tooth,
    ): JsonResponse {
        $this->authorize('updateClinical', $patient);

        abort_unless(in_array($tooth, ToothState::PERMANENT_TEETH, true), 422,
            'Número de diente fuera de rango.');

        $state = ToothState::query()->firstOrNew([
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'tooth_number' => $tooth,
        ], [
            'dentition_type' => 'permanent',
            'faces' => ToothState::defaultFaces(),
        ]);

        // Mezclamos sólo las caras enviadas para no pisar las demás.
        if ($request->has('faces')) {
            $current = $state->faces ?? ToothState::defaultFaces();
            $state->faces = array_replace($current, $request->validated('faces'));
        }

        if ($request->has('whole_state')) {
            $state->whole_state = $request->validated('whole_state');
        }

        if ($request->has('notes')) {
            $state->notes = $request->validated('notes');
        }

        $state->updated_by_user_id = $request->user()?->id;
        $state->save();
        $state->load('updatedBy');

        return response()->json(['data' => ToothStateResource::make($state)]);
    }
}
