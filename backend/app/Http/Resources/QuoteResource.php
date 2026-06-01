<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Quote
 */
class QuoteResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $today = now()->startOfDay();
        $expired = $this->valid_until !== null
            && $this->valid_until->lt($today)
            && ! in_array($this->status, ['converted', 'rejected'], true);

        return [
            'id' => $this->id,
            'code' => $this->code,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient->full_name),
            'subtotal' => (float) $this->subtotal,
            'discount_total' => (float) $this->discount_total,
            'total' => (float) $this->total,
            'status' => $this->status,
            'is_expired' => $expired,
            'is_editable' => $this->isEditable(),
            'notes' => $this->notes,
            'valid_until' => $this->valid_until?->toDateString(),
            'sent_at' => $this->sent_at?->toIso8601String(),
            'accepted_at' => $this->accepted_at?->toIso8601String(),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'converted_at' => $this->converted_at?->toIso8601String(),
            'converted_charge_id' => $this->converted_charge_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded('createdBy', fn () => $this->createdBy?->name),
            'items' => QuoteItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
