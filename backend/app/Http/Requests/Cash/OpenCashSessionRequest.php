<?php

declare(strict_types=1);

namespace App\Http\Requests\Cash;

use App\Models\CashSession;
use Illuminate\Foundation\Http\FormRequest;

class OpenCashSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('operate', CashSession::class) ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'opening_amount' => ['required', 'numeric', 'min:0', 'max:1000000'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
