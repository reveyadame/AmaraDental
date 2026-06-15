<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Odontogram\StoreTreatmentLogRequest;
use App\Http\Resources\DentalTreatmentLogResource;
use App\Models\DentalTreatmentLog;
use App\Models\Patient;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Bitácora de tratamientos del odontograma. Lectura para quien puede ver el
 * expediente clínico; alta para quien lo gestiona; baja sólo admin. Cada
 * cambio queda auditado (NOM-024) por el trait Auditable del modelo.
 */
class DentalTreatmentLogController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Patient $patient): AnonymousResourceCollection
    {
        $this->authorize('viewClinical', $patient);

        $entries = DentalTreatmentLog::query()
            ->with(['treatment', 'createdBy'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('performed_on')
            ->orderByDesc('id')
            ->get();

        return DentalTreatmentLogResource::collection($entries);
    }

    public function store(StoreTreatmentLogRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('updateClinical', $patient);

        $entry = DentalTreatmentLog::query()->create([
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'tooth_number' => $request->integer('tooth_number') ?: null,
            'treatment_id' => $request->integer('treatment_id') ?: null,
            'performed_on' => $request->date('performed_on'),
            'description' => $request->string('description'),
            'notes' => $request->input('notes') ?: null,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $entry->load(['treatment', 'createdBy']);

        return response()->json(['data' => DentalTreatmentLogResource::make($entry)], 201);
    }

    public function destroy(Request $request, Patient $patient, DentalTreatmentLog $logEntry): JsonResponse
    {
        $this->requireAdmin();
        abort_unless($logEntry->patient_id === $patient->id, 404);

        $logEntry->delete();

        return response()->json(['message' => 'OK']);
    }
}
