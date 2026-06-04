<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Treatment
 */
class TreatmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'category' => $this->category,
            'description' => $this->description,
            'base_price' => (float) $this->base_price,
            'duration_minutes' => $this->duration_minutes,
            'commission_percent' => $this->commission_percent !== null
                ? (float) $this->commission_percent : null,
            'commission_base' => $this->commission_base ?? 'price',
            'cost' => (float) $this->cost,
            'periodicity_days' => $this->periodicity_days,
            'recall_label' => $this->recall_label,
            'requires_consent_template_id' => $this->requires_consent_template_id,
            'active' => $this->active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
