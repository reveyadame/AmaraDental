<?php

declare(strict_types=1);

namespace App\Http\Requests\Odontogram;

use App\Models\Patient;
use App\Models\ToothState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateToothStateRequest extends FormRequest
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
        $faceStates = ToothState::FACE_STATES;
        $faceKeys = ToothState::FACE_KEYS;
        $wholeStates = ToothState::WHOLE_STATES;

        return [
            'whole_state' => ['nullable', Rule::in($wholeStates)],
            'faces' => ['nullable', 'array'],
            // Solo aceptamos las 5 caras conocidas — cualquier otra clave rompe validación.
            'faces.*' => [Rule::in($faceStates)],

            // Validamos explícitamente cada cara permitida para reportar el campo exacto.
            ...array_fill_keys(
                array_map(fn ($k) => "faces.$k", $faceKeys),
                ['sometimes', Rule::in($faceStates)],
            ),

            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
