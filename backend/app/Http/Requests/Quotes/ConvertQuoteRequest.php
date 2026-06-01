<?php

declare(strict_types=1);

namespace App\Http\Requests\Quotes;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvertQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quote = $this->route('quote');

        return $quote !== null && ($this->user()?->can('convert', $quote) ?? false);
    }

    /**
     * Permite registrar pagos iniciales en la conversión. Si se omite, el
     * cobro queda pendiente y se abona después desde Caja.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:1000'],

            'payments' => ['nullable', 'array'],
            'payments.*.method' => ['required', Rule::in(PaymentMethod::values())],
            'payments.*.amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'payments.*.reference' => ['nullable', 'string', 'max:120'],
            'payments.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
