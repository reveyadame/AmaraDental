<?php

declare(strict_types=1);

namespace App\Http\Requests\Recalls;

use App\Models\Recall;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRecallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('recall')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'due_on' => ['sometimes', 'date'],
            'status' => ['sometimes', Rule::in(Recall::statuses())],
            'scheduled_appointment_id' => [
                'nullable', 'integer', 'exists:appointments,id',
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
