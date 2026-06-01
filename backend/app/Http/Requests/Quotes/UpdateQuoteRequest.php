<?php

declare(strict_types=1);

namespace App\Http\Requests\Quotes;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quote = $this->route('quote');

        return $quote !== null && ($this->user()?->can('update', $quote) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:2000'],
            'valid_until' => ['nullable', 'date'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.treatment_id' => ['required', 'integer', 'exists:treatments,id'],
            'items.*.specialist_id' => ['nullable', 'integer', 'exists:specialists,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.discount_id' => ['nullable', 'integer', 'exists:discounts,id'],
            'items.*.unit_price_override' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ];
    }
}
