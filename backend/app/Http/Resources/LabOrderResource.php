<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\LabOrder
 */
class LabOrderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient?->full_name),
            'treatment_id' => $this->treatment_id,
            'treatment_name' => $this->whenLoaded('treatment', fn () => $this->treatment?->name),
            'specialist_id' => $this->specialist_id,
            'specialist_name' => $this->whenLoaded('specialist', fn () => $this->specialist?->name),
            'lab_id' => $this->lab_id,
            'lab_name' => $this->lab_name,
            'work_type' => $this->work_type,
            'specifications' => $this->specifications,
            'sent_on' => $this->sent_on?->toDateString(),
            'due_on' => $this->due_on?->toDateString(),
            'received_on' => $this->received_on?->toDateString(),
            'delivered_to_patient_on' => $this->delivered_to_patient_on?->toDateString(),
            'cost' => (float) $this->cost,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
