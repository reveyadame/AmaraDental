<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Prescription
 */
class PrescriptionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient?->full_name),
            'patient_age' => $this->whenLoaded('patient', function () {
                $dob = $this->patient?->date_of_birth;
                return $dob ? (int) $dob->diffInYears(now()) : null;
            }),
            'patient_gender' => $this->whenLoaded('patient', fn () => $this->patient?->gender),

            'specialist_id' => $this->specialist_id,
            'specialist_name' => $this->whenLoaded('specialist', fn () => $this->specialist?->name),
            'specialist_cedula' => $this->whenLoaded(
                'specialist',
                fn () => $this->specialist?->cedula_profesional,
            ),
            'specialist_specialty' => $this->whenLoaded(
                'specialist',
                fn () => $this->specialist?->specialty,
            ),

            'appointment_id' => $this->appointment_id,
            'diagnosis' => $this->diagnosis,
            'notes' => $this->notes,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'created_by_user_id' => $this->created_by_user_id,

            'items' => PrescriptionItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
