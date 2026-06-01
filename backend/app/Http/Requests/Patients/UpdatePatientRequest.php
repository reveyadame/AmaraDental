<?php

declare(strict_types=1);

namespace App\Http\Requests\Patients;

use App\Models\Patient;
use App\Support\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Patient|null $target */
        $target = $this->route('patient');

        return $target && ($this->user()?->can('update', $target) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Patient $target */
        $target = $this->route('patient');

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:120'],
            'last_name' => ['sometimes', 'required', 'string', 'max:120'],
            // Nullable en update: si el paciente está en estado "primera vez",
            // aún no llenó fecha de nacimiento ni género. El controller baja
            // la bandera automáticamente cuando ambos quedan llenos.
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'gender' => ['sometimes', 'nullable', Rule::in(['M', 'F', 'Otro'])],
            'is_first_visit' => ['sometimes', 'boolean'],
            'marital_status' => [
                'nullable',
                Rule::in(['soltero', 'casado', 'union_libre', 'divorciado', 'viudo', 'separado']),
            ],
            'curp' => [
                'nullable', 'string', 'size:18', 'regex:/^[A-Z0-9]{18}$/',
                Rule::unique('patients', 'curp')
                    ->where('tenant_id', TenantContext::tenantId())
                    ->ignore($target->id),
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
