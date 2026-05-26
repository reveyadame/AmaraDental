<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Recall extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\RecallFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_DISMISSED = 'dismissed';

    /** @return array<int, string> */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_SCHEDULED,
            self::STATUS_COMPLETED,
            self::STATUS_DISMISSED,
        ];
    }

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'treatment_id',
        'due_on',
        'status',
        'source_charge_id',
        'scheduled_appointment_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'due_on' => 'date',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    public function sourceCharge(): BelongsTo
    {
        return $this->belongsTo(Charge::class, 'source_charge_id');
    }

    public function scheduledAppointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'scheduled_appointment_id');
    }
}
