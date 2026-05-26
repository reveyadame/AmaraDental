<?php

declare(strict_types=1);

namespace App\Http\Requests\Discounts;

use App\Models\Discount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Discount|null $target */
        $target = $this->route('discount');

        return $target && ($this->user()?->can('update', $target) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'type' => ['sometimes', 'required', Rule::in(['percent', 'amount'])],
            'value' => ['sometimes', 'required', 'numeric', 'min:0', 'max:1000000'],
            'scope' => ['sometimes', 'required', Rule::in(['global', 'treatment'])],
            'treatment_id' => ['nullable', 'integer', 'exists:treatments,id'],
            'valid_from' => ['nullable', 'date'],
            'valid_to' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
