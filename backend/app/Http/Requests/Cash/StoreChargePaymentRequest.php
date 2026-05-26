<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use App\Enums\PaymentMethod;
use App\Models\Charge;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChargePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Charge::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'method' => ['required', Rule::in(PaymentMethod::values())],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
