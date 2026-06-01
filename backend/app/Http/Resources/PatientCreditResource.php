<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PatientCredit
 */
class PatientCreditResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'amount' => (float) $this->amount,
            'source' => $this->source,
            'charge_id' => $this->charge_id,
            'charge_payment_id' => $this->charge_payment_id,
            'notes' => $this->notes,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded(
                'createdBy',
                fn () => $this->createdBy?->name,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
