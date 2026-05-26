<?php

declare(strict_types=1);

namespace App\Http\Requests\Patients;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMedicalHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Patient|null $patient */
        $patient = $this->route('patient');

        return $patient && ($this->user()?->can('update', $patient) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'chronic_conditions' => ['nullable', 'array'],
            'chronic_conditions.*' => ['string', 'max:120'],
            'allergies' => ['nullable', 'array'],
            'allergies.*' => ['string', 'max:120'],
            'current_medications' => ['nullable', 'array'],
            'current_medications.*' => ['string', 'max:200'],
            'previous_surgeries' => ['nullable', 'string', 'max:5000'],
            'family_history' => ['nullable', 'string', 'max:5000'],
            'dental_history' => ['nullable', 'string', 'max:5000'],
            'last_dental_visit' => ['nullable', 'date'],
            'pregnancy_status' => ['nullable', Rule::in(['no', 'si', 'posible', 'na'])],
            'smoker' => ['nullable', 'boolean'],
            'alcohol_consumer' => ['nullable', 'boolean'],
            'blood_pressure' => ['nullable', 'string', 'max:15'],
            'heart_rate' => ['nullable', 'integer', 'min:30', 'max:250'],
            'temperature' => ['nullable', 'numeric', 'min:30', 'max:45'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'height_cm' => ['nullable', 'numeric', 'min:0', 'max:260'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
