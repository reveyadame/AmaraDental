<?php

declare(strict_types=1);

namespace App\Http\Requests\Labs;

use App\Models\LabOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('order')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['sometimes', 'required', 'integer', 'exists:patients,id'],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
            'lab_id' => ['nullable', 'integer', 'exists:labs,id'],
            'lab_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'work_type' => ['nullable', 'string', 'max:120'],
            'specifications' => ['nullable', 'string', 'max:2000'],
            'sent_on' => ['nullable', 'date'],
            'due_on' => ['nullable', 'date'],
            'received_on' => ['nullable', 'date'],
            'delivered_to_patient_on' => ['nullable', 'date'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', Rule::in(LabOrder::statuses())],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
