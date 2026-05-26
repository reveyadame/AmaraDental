<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Discount
 */
class DiscountResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'value' => (float) $this->value,
            'scope' => $this->scope,
            'treatment_id' => $this->treatment_id,
            'treatment' => TreatmentResource::make($this->whenLoaded('treatment')),
            'valid_from' => $this->valid_from?->toDateString(),
            'valid_to' => $this->valid_to?->toDateString(),
            'active' => $this->active,
        ];
    }
}
