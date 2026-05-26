<?php

declare(strict_types=1);

namespace App\Http\Requests\Prescriptions;

use App\Models\Prescription;
use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Prescription::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'specialist_id' => ['required', 'integer', 'exists:specialists,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'diagnosis' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'issued_at' => ['nullable', 'date'],

            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.medication' => ['required', 'string', 'max:255'],
            'items.*.presentation' => ['nullable', 'string', 'max:255'],
            'items.*.dosage' => ['required', 'string', 'max:255'],
            'items.*.route' => ['nullable', 'string', 'max:60'],
            'items.*.frequency' => ['required', 'string', 'max:160'],
            'items.*.duration' => ['required', 'string', 'max:160'],
            'items.*.instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
