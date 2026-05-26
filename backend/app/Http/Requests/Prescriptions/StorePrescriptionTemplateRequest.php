<?php

declare(strict_types=1);

namespace App\Http\Requests\Prescriptions;

use App\Models\PrescriptionTemplate;
use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', PrescriptionTemplate::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'active' => ['sometimes', 'boolean'],

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
