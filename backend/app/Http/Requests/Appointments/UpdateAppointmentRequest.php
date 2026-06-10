<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointments;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Support\AppointmentAvailability;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Appointment|null $target */
        $target = $this->route('appointment');

        return $target && ($this->user()?->can('update', $target) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['sometimes', 'integer', 'exists:patients,id'],
            'specialist_id' => ['sometimes', 'integer', 'exists:specialists,id'],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'room' => ['nullable', 'string', 'max:60'],
            'status' => ['sometimes', Rule::in(AppointmentStatus::values())],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            // Solo validamos cuando se está moviendo el horario o el dentista.
            $hasTimeOrSpecialist =
                $this->has('starts_at')
                || $this->has('ends_at')
                || $this->has('specialist_id');
            if (! $hasTimeOrSpecialist) {
                return;
            }

            /** @var Appointment|null $current */
            $current = $this->route('appointment');
            if (! $current) {
                return;
            }
            // Reprogramar al pasado no se permite. Solo aplica cuando se cambia
            // el horario a un valor distinto; re-guardar una cita pasada sin
            // moverla (ej. editar notas) sí se permite.
            if ($this->has('starts_at')) {
                $newStart = Carbon::parse((string) $this->input('starts_at'));
                // Comparación a nivel de minuto: editar una cita pasada sin
                // moverla reenvía el mismo horario (sin segundos) y debe pasar.
                $moved = ! $newStart->copy()->startOfMinute()
                    ->equalTo($current->starts_at->copy()->startOfMinute());
                if ($moved && $newStart->isPast()) {
                    $v->errors()->add('starts_at', 'No se puede reprogramar a una fecha u hora pasada.');

                    return;
                }
            }

            // Valores efectivos: del request si vienen, si no de la cita actual.
            $specialistId = (int) ($this->input('specialist_id')
                ?? $current->specialist_id);
            $startsAt = (string) ($this->input('starts_at')
                ?? $current->starts_at);
            $endsAt = (string) ($this->input('ends_at')
                ?? $current->ends_at);

            $conflict = AppointmentAvailability::findConflict(
                $specialistId,
                $startsAt,
                $endsAt,
                ignoreAppointmentId: $current->id,
            );
            if ($conflict) {
                $v->errors()->add('starts_at', $conflict);
            }
        });
    }
}
