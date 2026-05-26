<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use App\Enums\PaymentMethod;
use App\Models\Charge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Charge::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'notes' => ['nullable', 'string', 'max:1000'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'items.*.specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.discount_id' => ['nullable', 'integer', 'exists:discounts,id'],
            'items.*.unit_price_override' => ['nullable', 'numeric', 'min:0', 'max:1000000'],

            'payments' => ['nullable', 'array'],
            'payments.*.method' => ['required', Rule::in(PaymentMethod::values())],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'payments.*.reference' => ['nullable', 'string', 'max:120'],
            'payments.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
