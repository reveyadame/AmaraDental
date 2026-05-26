<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Patients\UpdateMedicalHistoryRequest;
use App\Http\Resources\MedicalHistoryResource;
use App\Models\MedicalHistory;
use App\Models\Patient;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class MedicalHistoryController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('viewClinical', $patient);

        $history = $patient->medicalHistory()->firstOrNew([], ['tenant_id' => $patient->tenant_id]);

        return response()->json(['data' => MedicalHistoryResource::make($history)]);
    }

    /**
     * Upsert: una sola entrada por paciente. Cada actualización queda en la
     * bitácora del paquete laravel-auditing (NOM-024).
     */
    public function update(UpdateMedicalHistoryRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('updateClinical', $patient);

        /** @var MedicalHistory $history */
        $history = $patient->medicalHistory()->firstOrNew([], ['tenant_id' => $patient->tenant_id]);
        $history->fill($request->validated());
        $history->updated_by_user_id = $request->user()?->id;
        $history->save();

        return response()->json(['data' => MedicalHistoryResource::make($history)]);
    }
}
