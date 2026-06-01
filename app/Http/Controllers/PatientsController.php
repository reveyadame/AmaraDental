<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Patients\StorePatientRequest;
use App\Http\Requests\Patients\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Consent;
use App\Models\DentalTreatmentLog;
use App\Models\EndodonticRecord;
use App\Models\LabOrder;
use App\Models\Membership;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Quote;
use App\Models\Recall;
use App\Models\ToothState;
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
        $data = $request->validated();

        // Consistencia: si llega como "primera vez" pero ya trae los campos
        // mínimos del expediente, lo guardamos directo como paciente formal.
        if (! empty($data['is_first_visit'])
            && ! empty($data['date_of_birth'])
            && ! empty($data['gender'])
        ) {
            $data['is_first_visit'] = false;
        }

        $patient = Patient::query()->create($data);

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

        // Auto-bajar bandera "primera vez" cuando el expediente ya tiene los
        // campos mínimos (fecha de nacimiento + género).
        if ($patient->is_first_visit && $patient->refresh()->hasMinimumClinicalRecord()) {
            $patient->update(['is_first_visit' => false]);
        }

        return response()->json(['data' => PatientResource::make($patient)]);
    }

    /**
     * Solo admin (policy) y solo si el paciente NO tiene registros
     * relacionados. Pensado para limpiar capturas erróneas o duplicados
     * recién creados — nunca para borrar a un paciente con historia.
     */
    public function destroy(Patient $patient): JsonResponse
    {
        $this->authorize('delete', $patient);

        $blockers = $this->relatedRecordCounts($patient);
        $nonEmpty = array_filter($blockers, fn ($n) => $n > 0);

        if (! empty($nonEmpty)) {
            return response()->json([
                'message' => 'No se puede eliminar el paciente porque tiene registros asociados. Inactívalo en su lugar.',
                'blockers' => $nonEmpty,
            ], 409);
        }

        $patient->delete();

        return response()->json(null, 204);
    }

    /**
     * Endpoint de pre-check: misma cuenta de relaciones que `destroy`, pero
     * sin efectuar el borrado. Permite al frontend explicar al admin por qué
     * el botón está bloqueado antes de que lo presione.
     */
    public function deletePreview(Patient $patient): JsonResponse
    {
        $this->authorize('delete', $patient);

        $blockers = $this->relatedRecordCounts($patient);
        $nonEmpty = array_filter($blockers, fn ($n) => $n > 0);

        return response()->json([
            'data' => [
                'can_delete' => empty($nonEmpty),
                'blockers' => $nonEmpty,
            ],
        ]);
    }

    /**
     * Cuenta de registros relacionados que bloquean la eliminación. Las
     * claves se devuelven al cliente y se usan para mostrar exactamente
     * qué impide eliminar al paciente.
     *
     * Para pacientes "primera vez", las citas y los recalls preventivos no
     * cuentan: la cita es la única huella esperada y se elimina en cascada;
     * los recalls son agendas preventivas sin valor clínico sin tratamiento.
     *
     * @return array<string, int>
     */
    private function relatedRecordCounts(Patient $patient): array
    {
        $pid = $patient->id;
        $isFirstVisit = (bool) $patient->is_first_visit;

        return [
            'appointments' => $isFirstVisit
                ? 0
                : Appointment::query()->where('patient_id', $pid)->count(),
            'charges' => Charge::query()->where('patient_id', $pid)->count(),
            'quotes' => Quote::query()->where('patient_id', $pid)->count(),
            'prescriptions' => Prescription::query()->where('patient_id', $pid)->count(),
            'consents' => Consent::query()->where('patient_id', $pid)->count(),
            'memberships' => Membership::query()->where('patient_id', $pid)->count(),
            'lab_orders' => LabOrder::query()->where('patient_id', $pid)->count(),
            'recalls' => $isFirstVisit
                ? 0
                : Recall::query()->where('patient_id', $pid)->count(),
            'tooth_states' => ToothState::query()->where('patient_id', $pid)->count(),
            'dental_treatment_logs' => DentalTreatmentLog::query()->where('patient_id', $pid)->count(),
            'endodontic_records' => EndodonticRecord::query()->where('patient_id', $pid)->count(),
        ];
    }
}
