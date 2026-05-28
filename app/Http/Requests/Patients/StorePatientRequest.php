<?php

declare(strict_types=1);

namespace App\Http\Requests\Patients;

use App\Models\Patient;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Patient::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', Rule::in(['M', 'F', 'Otro'])],
            'marital_status' => [
                'nullable',
                Rule::in(['soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado']),
            ],
            'curp' => [
                'nullable', 'string', 'size:18', 'regex:/^[A-Z0-9]{18}$/',
                Rule::unique('patients', 'curp')->where('tenant_id', TenantContext::tenantId()),
            ],
            'rfc' => ['nullable', 'string', 'max:13'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'mobile_phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:120'],
            'country' => ['nullable', Rule::in(['MX', 'US'])],
            'postal_code' => ['nullable', 'string', 'max:10'],
            'emergency_contact_name' => ['nullable', 'string', 'max:160'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:32'],
            'occupation' => ['nullable', 'string', 'max:120'],
            'referred_by' => ['nullable', 'string', 'max:160'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
