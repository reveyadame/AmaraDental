<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class TreatmentSpecialistCommission extends Model implements Auditable
{
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'specialist_id',
        'treatment_id',
        'commission_percent',
    ];

    protected function casts(): array
    {
        return [
            'commission_percent' => 'decimal:2',
        ];
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(Specialist::class);
    }

    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    /**
     * Resolución de comisión efectiva: override → default del tratamiento →
     * default del especialista → null.
     *
     * @param  float|null  $override   Valor en `treatment_specialist_commissions`.
     * @param  float|null  $treatmentDefault `treatments.commission_percent`
     * @param  float|null  $specialistDefault `users.default_commission_percent`
     */
    public static function resolveEffective(
        ?float $override,
        ?float $treatmentDefault,
        ?float $specialistDefault,
    ): ?float {
        return $override ?? $treatmentDefault ?? $specialistDefault;
    }
}
