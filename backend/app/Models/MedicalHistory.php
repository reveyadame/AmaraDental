<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class MedicalHistory extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\MedicalHistoryFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'chronic_conditions',
        'allergies',
        'current_medications',
        'previous_surgeries',
        'family_history',
        'dental_history',
        'last_dental_visit',
        'pregnancy_status',
        'smoker',
        'alcohol_consumer',
        'blood_pressure',
        'heart_rate',
        'temperature',
        'weight_kg',
        'height_cm',
        'notes',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'chronic_conditions' => 'array',
            'allergies' => 'array',
            'current_medications' => 'array',
            'last_dental_visit' => 'date',
            'smoker' => 'boolean',
            'alcohol_consumer' => 'boolean',
            'temperature' => 'decimal:2',
            'weight_kg' => 'decimal:2',
            'height_cm' => 'decimal:2',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by_user_id');
    }
}
