<?php

declare(strict_types=1);

namespace App\Http\Requests\Labs;

use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('lab')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var \App\Models\Lab|null $lab */
        $lab = $this->route('lab');

        return [
            'name' => [
                'sometimes', 'required', 'string', 'max:255',
                Rule::unique('labs', 'name')
                    ->where('tenant_id', TenantContext::tenantId())
                    ->ignore($lab?->id),
            ],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
