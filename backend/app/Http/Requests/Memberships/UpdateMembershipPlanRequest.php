<?php

declare(strict_types=1);

namespace App\Http\Requests\Memberships;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMembershipPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('plan')) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'annual_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'valid_months' => ['sometimes', 'required', 'integer', 'min:1', 'max:60'],
            'default_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'active' => ['sometimes', 'boolean'],

            'treatments' => ['sometimes', 'array'],
            'treatments.*.treatment_id' => ['required_with:treatments', 'integer', 'exists:treatments,id'],
            'treatments.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'treatments.*.annual_quota' => ['nullable', 'integer', 'min:1', 'max:365'],
        ];
    }
}
