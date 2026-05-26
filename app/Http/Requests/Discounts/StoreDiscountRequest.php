<?php

declare(strict_types=1);

namespace App\Http\Requests\Discounts;

use App\Models\Discount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Discount::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'type' => ['required', Rule::in(['percent', 'amount'])],
            'value' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'scope' => ['required', Rule::in(['global', 'treatment'])],
            'treatment_id' => ['nullable', 'required_if:scope,treatment', 'integer', 'exists:treatments,id'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
