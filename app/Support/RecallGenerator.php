<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Charge;
use App\Models\Recall;
use Carbon\CarbonImmutable;

/**
 * Genera recalls preventivos cuando un cobro queda pagado.
 *
 * Reglas:
 * - Solo aplica a items con un `treatment` que tiene `periodicity_days` > 0.
 * - Si el paciente ya tiene un recall activo (pending|scheduled) para ese
 *   mismo tratamiento, se actualiza la fecha del más reciente en lugar de
 *   duplicar.
 */
class RecallGenerator
{
    /**
     * @return int Cantidad de recalls creados o actualizados.
     */
    public static function fromCharge(Charge $charge): int
    {
        if ($charge->status !== 'paid') {
            return 0;
        }
        $charge->loadMissing(['items.treatment']);
        $baseDate = CarbonImmutable::parse($charge->paid_at ?? $charge->created_at ?? now());
        $touched = 0;

        foreach ($charge->items as $item) {
            $treatment = $item->treatment;
            if (! $treatment || ! $treatment->periodicity_days) {
                continue;
            }
            $dueOn = $baseDate->addDays((int) $treatment->periodicity_days)->toDateString();

            $existing = Recall::query()
                ->where('patient_id', $charge->patient_id)
                ->where('treatment_id', $treatment->id)
                ->whereIn('status', [Recall::STATUS_PENDING, Recall::STATUS_SCHEDULED])
                ->orderByDesc('id')
                ->first();

            if ($existing) {
                // Si ya estaba agendada una cita, no movemos la fecha del recall.
                if ($existing->status === Recall::STATUS_PENDING) {
                    $existing->update([
                        'due_on' => $dueOn,
                        'source_charge_id' => $charge->id,
                    ]);
                    $touched++;
                }
                continue;
            }

            Recall::query()->create([
                'tenant_id' => $charge->tenant_id,
                'patient_id' => $charge->patient_id,
                'treatment_id' => $treatment->id,
                'due_on' => $dueOn,
                'status' => Recall::STATUS_PENDING,
                'source_charge_id' => $charge->id,
            ]);
            $touched++;
        }
        return $touched;
    }
}
