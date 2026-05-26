<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ChargePayment
 */
class ChargePaymentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'charge_id' => $this->charge_id,
            'cash_session_id' => $this->cash_session_id,
            'method' => $this->method,
            'amount' => (float) $this->amount,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'reference' => $this->reference,
            'notes' => $this->notes,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user->name),
        ];
    }
}
