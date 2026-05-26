<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Validation\Rule;

class AppointmentsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Appointment::class);

        $appointments = Appointment::query()
            ->with(['patient', 'specialist', 'treatment'])
            ->when($request->filled('date_from'),
                fn ($q) => $q->where('ends_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->where('starts_at', '<=', $request->date('date_to')))
            ->when($request->filled('specialist_id'),
                fn ($q) => $q->where('specialist_id', $request->integer('specialist_id')))
            ->when($request->filled('patient_id'),
                fn ($q) => $q->where('patient_id', $request->integer('patient_id')))
            ->when($request->filled('status'),
                fn ($q) => $q->where('status', $request->string('status')))
            ->orderBy('starts_at')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function show(Appointment $appointment): JsonResponse
    {
        $this->authorize('view', $appointment);

        $appointment->load(['patient', 'specialist', 'treatment', 'createdBy']);

        return response()->json(['data' => AppointmentResource::make($appointment)]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = Appointment::query()->create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()->id,
        ]);

        $appointment->load(['patient', 'specialist', 'treatment']);

        return response()->json(['data' => AppointmentResource::make($appointment)], 201);
    }

    public function update(
        UpdateAppointmentRequest $request,
        Appointment $appointment,
    ): JsonResponse {
        $appointment->update($request->validated());
        $appointment->load(['patient', 'specialist', 'treatment']);

        return response()->json(['data' => AppointmentResource::make($appointment)]);
    }

    public function changeStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('changeStatus', $appointment);

        $data = $request->validate([
            'status' => ['required', Rule::in(AppointmentStatus::values())],
        ]);

        $appointment->status = $data['status'];
        if ($data['status'] === AppointmentStatus::Confirmed->value && ! $appointment->confirmed_at) {
            $appointment->confirmed_at = now();
        }
        $appointment->save();
        $appointment->load(['patient', 'specialist', 'treatment']);

        return response()->json(['data' => AppointmentResource::make($appointment)]);
    }

    public function destroy(Appointment $appointment): JsonResponse
    {
        $this->authorize('delete', $appointment);

        $appointment->delete();

        return response()->json(['message' => 'OK']);
    }
}
