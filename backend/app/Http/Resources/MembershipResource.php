<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Membership
 */
class MembershipResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient?->full_name),
            'membership_plan_id' => $this->membership_plan_id,
            'plan_name' => $this->whenLoaded('plan', fn () => $this->plan?->name),
            'starts_on' => $this->starts_on?->toDateString(),
            'ends_on' => $this->ends_on?->toDateString(),
            'status' => $this->status,
            'is_currently_active' => $this->isCurrentlyActive(),
            'price_paid' => (float) $this->price_paid,
            'charge_id' => $this->charge_id,
            'notes' => $this->notes,
            'plan' => $this->whenLoaded('plan', fn () => MembershipPlanResource::make($this->plan)),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
