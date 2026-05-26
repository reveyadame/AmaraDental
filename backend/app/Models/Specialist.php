<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

/**
 * Especialista (catálogo). NO es usuario del sistema: solo se referencia
 * desde citas, recetas, cobros y pagos de comisión.
 */
class Specialist extends Model implements Auditable
{
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'specialty',
        'cedula_profesional',
        'default_commission_percent',
        'bio',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'default_commission_percent' => 'decimal:2',
        ];
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function chargeItems(): HasMany
    {
        return $this->hasMany(ChargeItem::class);
    }

    public function commissionPayments(): HasMany
    {
        return $this->hasMany(CommissionPayment::class);
    }
}
