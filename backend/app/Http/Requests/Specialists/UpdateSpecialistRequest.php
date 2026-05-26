<?php

declare(strict_types=1);

namespace App\Http\Requests\Specialists;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSpecialistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('catalogs.manage') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'cedula_profesional' => ['nullable', 'string', 'max:32'],
            'specialty' => ['nullable', 'string', 'max:120'],
            'default_commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
