<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\DentalTreatmentLog
 */
class DentalTreatmentLogResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'tooth_number' => $this->tooth_number,
            'treatment_id' => $this->treatment_id,
            'treatment_name' => $this->whenLoaded('treatment', fn () => $this->treatment?->name),
            'performed_on' => $this->performed_on?->toDateString(),
            'description' => $this->description,
            'notes' => $this->notes,
            'created_by_user_id' => $this->created_by_user_id,
            'created_by_name' => $this->whenLoaded('createdBy', fn () => $this->createdBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
