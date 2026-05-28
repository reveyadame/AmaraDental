<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\EndodonticRecord
 */
class EndodonticRecordResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'tooth_number' => $this->tooth_number,
            'performed_on' => $this->performed_on?->toDateString(),
            'chief_complaint' => $this->chief_complaint,
            'pulpal_diagnosis' => $this->pulpal_diagnosis,
            'periapical_diagnosis' => $this->periapical_diagnosis,
            'cold_test' => $this->cold_test,
            'heat_test' => $this->heat_test,
            'electric_test' => $this->electric_test,
            'percussion' => $this->percussion,
            'palpation' => $this->palpation,
            'mobility' => $this->mobility,
            'radiographic_findings' => $this->radiographic_findings,
            'canals_count' => $this->canals_count,
            'working_length' => $this->working_length,
            'irrigation' => $this->irrigation,
            'intracanal_medication' => $this->intracanal_medication,
            'obturation_technique' => $this->obturation_technique,
            'sealer' => $this->sealer,
            'sessions' => $this->sessions,
            'prognosis' => $this->prognosis,
            'treatment_plan' => $this->treatment_plan,
            'treatment_log' => $this->treatment_log ?? [],
            'specialist_id' => $this->specialist_id,
            'specialist_name' => $this->whenLoaded('specialist', fn () => $this->specialist?->name),
            'created_by_name' => $this->whenLoaded('createdBy', fn () => $this->createdBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
