<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Recall
 */
class RecallResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $today = now()->toDateString();
        $dueOn = $this->due_on?->toDateString();
        $daysUntilDue = $dueOn
            ? (int) (new \DateTime($dueOn))->diff(new \DateTime($today))->format('%r%a') * -1
            : null;

        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'patient_name' => $this->whenLoaded('patient', fn () => $this->patient?->full_name),
            'patient_phone' => $this->whenLoaded('patient',
                fn () => $this->patient?->mobile_phone ?? $this->patient?->phone),
            'treatment_id' => $this->treatment_id,
            'treatment_name' => $this->whenLoaded('treatment', fn () => $this->treatment?->name),
            'recall_label' => $this->whenLoaded('treatment',
                fn () => $this->treatment?->recall_label ?? $this->treatment?->name),
            'due_on' => $dueOn,
            'days_until_due' => $daysUntilDue,
            'is_overdue' => $daysUntilDue !== null && $daysUntilDue < 0,
            'status' => $this->status,
            'source_charge_id' => $this->source_charge_id,
            'scheduled_appointment_id' => $this->scheduled_appointment_id,
            'scheduled_at' => $this->whenLoaded('scheduledAppointment',
                fn () => $this->scheduledAppointment?->starts_at?->toIso8601String()),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
