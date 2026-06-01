<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

/**
 * Movimiento del saldo a favor del paciente. El saldo actual es la suma
 * de todos los `amount` para ese paciente.
 */
class PatientCredit extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\PatientCreditFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'amount',
        'source',
        'charge_id',
        'charge_payment_id',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class);
    }

    public function chargePayment(): BelongsTo
    {
        return $this->belongsTo(ChargePayment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
