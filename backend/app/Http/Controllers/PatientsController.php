<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Patients\StorePatientRequest;
use App\Http\Requests\Patients\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PatientsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Patient::class);

        $patients = Patient::query()
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('first_name', 'like', $term)
                      ->orWhere('last_name', 'like', $term)
                      ->orWhere('email', 'like', $term)
                      ->orWhere('phone', 'like', $term)
                      ->orWhere('mobile_phone', 'like', $term)
                      ->orWhere('curp', 'like', $term);
                });
            })
            ->when($request->boolean('only_active', false), fn ($q) => $q->where('active', true))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($request->integer('per_page', 25));

        return PatientResource::collection($patients);
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = Patient::query()->create($request->validated());

        return response()->json(['data' => PatientResource::make($patient)], 201);
    }

    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        $patient->load(['medicalHistory', 'consents' => fn ($q) => $q->orderByDesc('signed_at')]);

        return response()->json(['data' => PatientResource::make($patient)]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient): JsonResponse
    {
        $patient->update($request->validated());

        return response()->json(['data' => PatientResource::make($patient)]);
    }

    public function destroy(Patient $patient): JsonResponse
    {
        $this->authorize('delete', $patient);

        $patient->delete();

        return response()->json(['message' => 'OK']);
    }
}
