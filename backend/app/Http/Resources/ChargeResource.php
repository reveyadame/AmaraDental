<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Charge
 */
class ChargeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient->full_name),
            'subtotal' => (float) $this->subtotal,
            'discount_total' => (float) $this->discount_total,
            'total' => (float) $this->total,
            'paid_total' => (float) $this->paid_total,
            'balance' => (float) $this->balance,
            'status' => $this->status,
            'notes' => $this->notes,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded('createdBy', fn () => $this->createdBy?->name),
            'items' => ChargeItemResource::collection($this->whenLoaded('items')),
            'payments' => ChargePaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
