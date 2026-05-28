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

class LabOrder extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\LabOrderFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RECEIVED = 'received';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_CANCELLED = 'cancelled';

    /** @return array<int, string> */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_IN_PROGRESS,
            self::STATUS_RECEIVED,
            self::STATUS_DELIVERED,
            self::STATUS_CANCELLED,
        ];
    }

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'treatment_id',
        'lab_id',
        'specialist_id',
        'lab_name',
        'work_type',
        'specifications',
        'sent_on',
        'due_on',
        'received_on',
        'delivered_to_patient_on',
        'cost',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sent_on' => 'date',
            'due_on' => 'date',
            'received_on' => 'date',
            'delivered_to_patient_on' => 'date',
            'cost' => 'decimal:2',
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

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(Specialist::class);
    }

    public function lab(): BelongsTo
    {
        return $this->belongsTo(Lab::class);
    }
}
