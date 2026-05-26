<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use App\Models\CashSession;
use Illuminate\Foundation\Http\FormRequest;

class CloseCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var CashSession|null $session */
        $session = $this->route('cashSession');

        return $session && ($this->user()?->can('close', $session) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Efectivo contado (obligatorio).
            'closing_amount' => ['required', 'numeric', 'min:0', 'max:1000000'],

            // Tarjeta y transferencia: opcionales. Si no se mandan, no se
            // registra contabilización para ese método pero el corte cierra.
            'card_counted' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'transfer_counted' => ['nullable', 'numeric', 'min:0', 'max:1000000'],

            'close_notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
