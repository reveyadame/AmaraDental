<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\AppointmentStatus;
use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Consent;
use App\Models\DentalTreatmentLog;
use App\Models\EndodonticRecord;
use App\Models\LabOrder;
use App\Models\Membership;
use App\Models\Prescription;
use App\Models\Quote;
use App\Models\ToothState;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
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

    /**
     * Marca la cita como `no_show` y, si el paciente fue capturado como
     * "primera vez" y no tiene otros registros (cobros, recetas, etc.),
     * elimina el paciente — la cita se borra en cascada con él.
     *
     * Solo aplica a `is_first_visit=true`. Para pacientes formales, hay que
     * marcar el no_show por la vía normal y, si se quiere eliminar, debe
     * hacerlo un admin desde la ficha del paciente.
     */
    public function markNoShowAndDiscardPatient(Appointment $appointment): JsonResponse
    {
        $this->authorize('changeStatus', $appointment);

        $appointment->load('patient');
        $patient = $appointment->patient;

        abort_if(! $patient, 422, 'La cita no tiene paciente asociado.');
        abort_if(! $patient->is_first_visit, 422,
            'Esta acción solo aplica a pacientes capturados como "primera vez".');

        // Autorización adicional: el usuario debe poder eliminar al paciente
        // (policy ya permite a operadores de agenda eliminar is_first_visit).
        $this->authorize('delete', $patient);

        $pid = $patient->id;
        $blockers = [
            'charges' => Charge::query()->where('patient_id', $pid)->count(),
            'quotes' => Quote::query()->where('patient_id', $pid)->count(),
            'prescriptions' => Prescription::query()->where('patient_id', $pid)->count(),
            'consents' => Consent::query()->where('patient_id', $pid)->count(),
            'memberships' => Membership::query()->where('patient_id', $pid)->count(),
            'lab_orders' => LabOrder::query()->where('patient_id', $pid)->count(),
            'tooth_states' => ToothState::query()->where('patient_id', $pid)->count(),
            'dental_treatment_logs' => DentalTreatmentLog::query()->where('patient_id', $pid)->count(),
            'endodontic_records' => EndodonticRecord::query()->where('patient_id', $pid)->count(),
        ];
        $nonEmpty = array_filter($blockers, fn ($n) => $n > 0);

        return DB::transaction(function () use ($appointment, $patient, $nonEmpty) {
            // Siempre dejamos la cita en `no_show` — el operador la marcó así.
            $appointment->update(['status' => AppointmentStatus::NoShow->value]);

            if (! empty($nonEmpty)) {
                // No podemos descartar al paciente: ya tiene huella. Solo
                // devolvemos la cita marcada y los bloqueadores para el UI.
                $appointment->refresh()->load(['patient', 'specialist', 'treatment']);

                return response()->json([
                    'data' => [
                        'patient_deleted' => false,
                        'patient_name' => $patient->full_name,
                        'blockers' => $nonEmpty,
                        'appointment' => AppointmentResource::make($appointment),
                    ],
                ]);
            }

            $patientName = $patient->full_name;
            // cascadeOnDelete en `appointments.patient_id` elimina TODAS sus
            // citas (incluida la actual). Es lo esperado para un paciente
            // fantasma de primera vez.
            $patient->delete();

            return response()->json([
                'data' => [
                    'patient_deleted' => true,
                    'patient_name' => $patientName,
                    'blockers' => [],
                    'appointment' => null,
                ],
            ]);
        });
    }
}
