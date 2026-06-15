<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Patients\StoreEndodonticRecordRequest;
use App\Http\Resources\EndodonticRecordResource;
use App\Models\EndodonticRecord;
use App\Models\Patient;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * Historia clínica de endodoncia por paciente (un registro por diente).
 * Lectura para quien ve el expediente; alta/edición para quien lo gestiona;
 * baja solo admin. Auditado por el trait Auditable del modelo (NOM-024).
 */
class EndodonticRecordsController extends Controller implements HasMiddleware
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

        $records = EndodonticRecord::query()
            ->with(['specialist', 'createdBy'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('performed_on')
            ->orderByDesc('id')
            ->get();

        return EndodonticRecordResource::collection($records);
    }

    public function store(StoreEndodonticRecordRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('updateClinical', $patient);

        $record = EndodonticRecord::query()->create([
            ...$request->validated(),
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $record->load(['specialist', 'createdBy']);

        return response()->json(['data' => EndodonticRecordResource::make($record)], 201);
    }

    public function update(
        StoreEndodonticRecordRequest $request,
        Patient $patient,
        EndodonticRecord $record,
    ): JsonResponse {
        $this->authorize('updateClinical', $patient);
        abort_unless($record->patient_id === $patient->id, 404);

        $record->update($request->validated());
        $record->load(['specialist', 'createdBy']);

        return response()->json(['data' => EndodonticRecordResource::make($record)]);
    }

    public function destroy(Request $request, Patient $patient, EndodonticRecord $record): JsonResponse
    {
        $this->requireAdmin();
        abort_unless($record->patient_id === $patient->id, 404);

        $record->delete();

        return response()->json(['message' => 'OK']);
    }
}
