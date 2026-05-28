<?php

declare(strict_types=1);

namespace App\Http\Requests\Odontogram;

use App\Models\ToothState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTreatmentLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        // La autorización fina (updateClinical) la resuelve el controlador
        // con la policy del paciente.
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'performed_on' => ['required', 'date'],
            'tooth_number' => ['nullable', 'integer', Rule::in(ToothState::PERMANENT_TEETH)],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'description' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
