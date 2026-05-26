<?php

declare(strict_types=1);

namespace App\Http\Requests\Prescriptions;

use App\Models\PrescriptionTemplate;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePrescriptionTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var PrescriptionTemplate|null $target */
        $target = $this->route('template');

        return $target && ($this->user()?->can('update', $target) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'category' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'active' => ['sometimes', 'boolean'],

            'items' => ['sometimes', 'array', 'min:1', 'max:20'],
            'items.*.medication' => ['required_with:items', 'string', 'max:255'],
            'items.*.presentation' => ['nullable', 'string', 'max:255'],
            'items.*.dosage' => ['required_with:items', 'string', 'max:255'],
            'items.*.route' => ['nullable', 'string', 'max:60'],
            'items.*.frequency' => ['required_with:items', 'string', 'max:160'],
            'items.*.duration' => ['required_with:items', 'string', 'max:160'],
            'items.*.instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
