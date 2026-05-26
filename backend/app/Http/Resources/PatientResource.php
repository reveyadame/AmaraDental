<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Patient
 */
class PatientResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $today = now();
        $age = $this->date_of_birth?->diffInYears($today);

        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age' => $age ? (int) $age : null,
            'gender' => $this->gender,
            'curp' => $this->curp,
            'rfc' => $this->rfc,
            'email' => $this->email,
            'phone' => $this->phone,
            'mobile_phone' => $this->mobile_phone,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_phone' => $this->emergency_contact_phone,
            'occupation' => $this->occupation,
            'referred_by' => $this->referred_by,
            'notes' => $this->notes,
            'active' => $this->active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            'medical_history' => MedicalHistoryResource::make($this->whenLoaded('medicalHistory')),
            'consents' => ConsentResource::collection($this->whenLoaded('consents')),
        ];
    }
}
