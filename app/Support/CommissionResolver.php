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
}
