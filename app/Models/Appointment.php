<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AppTimezoneDateTime;
use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Appointment extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\AppointmentFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'specialist_id',
        'treatment_id',
        'created_by_user_id',
        'title',
        'notes',
        'starts_at',
        'ends_at',
        'room',
        'status',
        'confirmed_at',
        'reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => AppTimezoneDateTime::class,
            'ends_at' => AppTimezoneDateTime::class,
            'confirmed_at' => AppTimezoneDateTime::class,
            'reminder_sent_at' => AppTimezoneDateTime::class,
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function specialist(): BelongsTo
    {
        return $this->belongsTo(Specialist::class);
    }

    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function scopeInRange(Builder $q, string $from, string $to): Builder
    {
        return $q->whereBetween('starts_at', [$from, $to]);
    }

    public function scopeForSpecialist(Builder $q, int $specialistId): Builder
    {
        return $q->where('specialist_id', $specialistId);
    }
}
