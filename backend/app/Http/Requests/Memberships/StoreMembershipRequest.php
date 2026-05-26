<?php

declare(strict_types=1);

namespace App\Http\Requests\Memberships;

use App\Models\Membership;
use Illuminate\Foundation\Http\FormRequest;

class StoreMembershipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Membership::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'membership_plan_id' => ['required', 'integer', 'exists:membership_plans,id'],
            'starts_on' => ['required', 'date'],
            // ends_on se calcula desde el plan si no se manda.
            'ends_on' => ['nullable', 'date', 'after:starts_on'],
            // si difiere del precio del plan, se respeta (descuento manual, regalo, etc.).
            'price_paid' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],

            // Si true, se crea un cobro asociado al precio.
            'create_charge' => ['sometimes', 'boolean'],
        ];
    }
}
