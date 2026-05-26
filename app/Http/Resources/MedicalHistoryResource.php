<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\MedicalHistory
 */
class MedicalHistoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'chronic_conditions' => $this->chronic_conditions ?? [],
            'allergies' => $this->allergies ?? [],
            'current_medications' => $this->current_medications ?? [],
            'previous_surgeries' => $this->previous_surgeries,
            'family_history' => $this->family_history,
            'dental_history' => $this->dental_history,
            'last_dental_visit' => $this->last_dental_visit?->toDateString(),
            'pregnancy_status' => $this->pregnancy_status,
            'smoker' => $this->smoker,
            'alcohol_consumer' => $this->alcohol_consumer,
            'blood_pressure' => $this->blood_pressure,
            'heart_rate' => $this->heart_rate,
            'temperature' => $this->temperature !== null ? (float) $this->temperature : null,
            'weight_kg' => $this->weight_kg !== null ? (float) $this->weight_kg : null,
            'height_cm' => $this->height_cm !== null ? (float) $this->height_cm : null,
            'notes' => $this->notes,
            'updated_by_user_id' => $this->updated_by_user_id,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
