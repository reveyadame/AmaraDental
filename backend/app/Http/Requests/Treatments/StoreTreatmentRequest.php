<?php

declare(strict_types=1);

namespace App\Http\Requests\Treatments;

use App\Models\Treatment;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTreatmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Treatment::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'code' => [
                'nullable', 'string', 'max:32',
                Rule::unique('treatments', 'code')->where('tenant_id', TenantContext::tenantId()),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:60'],
            'description' => ['nullable', 'string', 'max:2000'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:600'],
            'commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_base' => ['sometimes', Rule::in(['price', 'profit'])],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'periodicity_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'recall_label' => ['nullable', 'string', 'max:120'],
            'requires_consent_template_id' => ['nullable', 'integer', 'exists:consent_templates,id'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
