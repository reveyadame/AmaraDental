<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use App\Models\CashExpense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CashExpense::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'category' => ['required', Rule::in(CashExpense::categories())],
            'description' => ['required', 'string', 'max:255'],
            'method' => ['required', Rule::in(CashExpense::methods())],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'reference' => ['nullable', 'string', 'max:120'],
            'related_lab_order_id' => ['nullable', 'integer', 'exists:lab_orders,id'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
