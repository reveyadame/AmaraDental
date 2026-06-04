<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Specialist;
use App\Models\Treatment;
use App\Models\TreatmentSpecialistCommission;

/**
 * Resuelve el porcentaje de comisión efectivo entre un especialista y un
 * tratamiento. Se usa al crear cada `charge_item` para hacer snapshot.
 */
final class CommissionResolver
{
    public static function resolve(?Specialist $specialist, Treatment $treatment): ?float
    {
        if (! $specialist) {
            return $treatment->commission_percent !== null
                ? (float) $treatment->commission_percent : null;
        }

        $override = TreatmentSpecialistCommission::query()
            ->where('specialist_id', $specialist->id)
            ->where('treatment_id', $treatment->id)
            ->value('commission_percent');

        return TreatmentSpecialistCommission::resolveEffective(
            $override !== null ? (float) $override : null,
            $treatment->commission_percent !== null ? (float) $treatment->commission_percent : null,
            $specialist->default_commission_percent !== null
                ? (float) $specialist->default_commission_percent : null,
        );
    }

    /**
     * Base sobre la que se aplica el porcentaje de comisión.
     *
     * En modo 'price' es el `line_total` (comportamiento histórico). En modo
     * 'profit' se descuenta el costo del insumo (`cost * quantity`) — ej. un
     * implante de $25,000 con costo $5,000 comisiona sobre $20,000. Nunca
     * regresa negativo: si el costo supera el cobrado, la base es 0.
     */
    public static function baseAmount(Treatment $treatment, float $lineTotal, int $quantity): float
    {
        if ($treatment->commission_base !== 'profit') {
            return round($lineTotal, 2);
        }

        return max(round($lineTotal - (float) $treatment->cost * $quantity, 2), 0.0);
    }
}
