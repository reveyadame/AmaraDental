<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \OwenIt\Auditing\Models\Audit
 */
class AuditResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event,
            'auditable_type' => $this->auditable_type,
            'auditable_label' => static::labelForType((string) $this->auditable_type),
            'auditable_id' => $this->auditable_id,
            'user_id' => $this->user_id,
            'user_name' => $this->whenLoaded('user', fn () => $this->user?->name),
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'url' => $this->url,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    public static function labelForType(string $fqn): string
    {
        return match ($fqn) {
            'App\\Models\\Patient' => 'Paciente',
            'App\\Models\\MedicalHistory' => 'Historia clínica',
            'App\\Models\\Consent' => 'Consentimiento',
            'App\\Models\\ConsentTemplate' => 'Plantilla de consentimiento',
            'App\\Models\\ToothState' => 'Odontograma',
            'App\\Models\\Treatment' => 'Tratamiento',
            'App\\Models\\Discount' => 'Descuento',
            'App\\Models\\TreatmentSpecialistCommission' => 'Comisión por tratamiento',
            'App\\Models\\Appointment' => 'Cita',
            'App\\Models\\Prescription' => 'Receta',
            'App\\Models\\PrescriptionTemplate' => 'Plantilla de receta',
            'App\\Models\\CashSession' => 'Corte de caja',
            'App\\Models\\Charge' => 'Cobro',
            'App\\Models\\ChargePayment' => 'Pago',
            'App\\Models\\CashExpense' => 'Egreso de caja',
            'App\\Models\\Membership' => 'Membresía',
            'App\\Models\\MembershipPlan' => 'Plan de membresía',
            'App\\Models\\LabOrder' => 'Orden de laboratorio',
            'App\\Models\\Recall' => 'Recall',
            'App\\Models\\User' => 'Usuario',
            default => class_basename($fqn),
        };
    }
}
