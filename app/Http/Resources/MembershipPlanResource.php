<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\MembershipPlan
 */
class MembershipPlanResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'annual_price' => (float) $this->annual_price,
            'valid_months' => $this->valid_months,
            'default_discount_percent' => (float) $this->default_discount_percent,
            'active' => $this->active,
            'treatments' => $this->whenLoaded('treatments', function () {
                return $this->treatments->map(fn ($t) => [
                    'id' => $t->id,
                    'name' => $t->name,
                    'code' => $t->code,
                    'base_price' => (float) $t->base_price,
                    'discount_percent' => $t->pivot->discount_percent !== null
                        ? (float) $t->pivot->discount_percent
                        : null,
                    'annual_quota' => $t->pivot->annual_quota,
                ]);
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
