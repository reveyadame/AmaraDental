<?php

declare(strict_types=1);

namespace App\Http\Requests\Commissions;

use App\Models\CommissionPayment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommissionPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CommissionPayment::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'specialist_id' => ['required', 'integer', 'exists:specialists,id'],
            'method' => ['required', Rule::in(CommissionPayment::methods())],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'paid_at' => ['nullable', 'date'],
            // IDs de charge_items cuya comisión se está liquidando.
            'charge_item_ids' => ['required', 'array', 'min:1'],
            'charge_item_ids.*' => ['integer', 'exists:charge_items,id'],
            // Si true, genera un CashExpense en la caja abierta del usuario
            // (category=commission).
            'register_as_expense' => ['sometimes', 'boolean'],
        ];
    }
}
