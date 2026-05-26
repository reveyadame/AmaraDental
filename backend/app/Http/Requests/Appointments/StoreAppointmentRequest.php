<?php

declare(strict_types=1);

namespace App\Http\Requests\Appointments;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Support\AppointmentAvailability;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Appointment::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'specialist_id' => ['required', 'integer', 'exists:specialists,id'],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
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
            $conflict = AppointmentAvailability::findConflict(
                (int) $this->input('specialist_id'),
                (string) $this->input('starts_at'),
                (string) $this->input('ends_at'),
            );
            if ($conflict) {
                $v->errors()->add('starts_at', $conflict);
            }
        });
    }
}
