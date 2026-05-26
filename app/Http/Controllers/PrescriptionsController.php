<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Prescriptions\StorePrescriptionRequest;
use App\Http\Resources\PrescriptionResource;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Specialist;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;

class PrescriptionsController extends Controller implements HasMiddleware
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

        $list = Prescription::query()
            ->with(['specialist', 'items'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('issued_at')
            ->get();

        return PrescriptionResource::collection($list);
    }

    public function store(
        StorePrescriptionRequest $request,
        Patient $patient,
    ): JsonResponse {
        $this->authorize('updateClinical', $patient);

        $specialistId = (int) $request->input('specialist_id');
        Specialist::query()->findOrFail($specialistId); // valida que existe.

        $prescription = DB::transaction(function () use ($request, $patient, $specialistId): Prescription {
            /** @var Prescription $rx */
            $rx = Prescription::query()->create([
                'tenant_id' => TenantContext::tenantId(),
                'patient_id' => $patient->id,
                'specialist_id' => $specialistId,
                'appointment_id' => $request->input('appointment_id'),
                'created_by_user_id' => $request->user()->id,
                'diagnosis' => $request->input('diagnosis'),
                'notes' => $request->input('notes'),
                'issued_at' => $request->input('issued_at') ?? now(),
            ]);
            $rx->code = sprintf('RX-%05d', $rx->id);
            $rx->save();

            foreach ($request->validated('items') as $idx => $item) {
                $rx->items()->create([
                    'tenant_id' => $rx->tenant_id,
                    'medication' => $item['medication'],
                    'presentation' => $item['presentation'] ?? null,
                    'dosage' => $item['dosage'],
                    'route' => $item['route'] ?? null,
                    'frequency' => $item['frequency'],
                    'duration' => $item['duration'],
                    'instructions' => $item['instructions'] ?? null,
                    'order_index' => $idx,
                ]);
            }

            return $rx;
        });

        $prescription->load(['patient', 'specialist', 'items']);

        return response()->json([
            'data' => PrescriptionResource::make($prescription),
        ], 201);
    }

    public function show(Prescription $prescription): JsonResponse
    {
        $this->authorize('view', $prescription);

        $prescription->load(['patient', 'specialist', 'items']);

        return response()->json([
            'data' => PrescriptionResource::make($prescription),
        ]);
    }

    public function destroy(Prescription $prescription): JsonResponse
    {
        $this->authorize('delete', $prescription);

        $prescription->delete();

        return response()->json(['message' => 'OK']);
    }
}
