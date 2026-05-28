<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class EndodonticRecord extends Model implements Auditable
{
    use AuditableTrait, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'tooth_number',
        'performed_on',
        'chief_complaint',
        'pulpal_diagnosis',
        'periapical_diagnosis',
        'cold_test',
        'heat_test',
        'electric_test',
        'percussion',
        'palpation',
        'mobility',
        'radiographic_findings',
        'canals_count',
        'working_length',
        'irrigation',
        'intracanal_medication',
        'obturation_technique',
        'sealer',
        'sessions',
        'prognosis',
        'treatment_plan',
        'treatment_log',
        'specialist_id',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'performed_on' => 'date',
            'tooth_number' => 'integer',
            'canals_count' => 'integer',
            'sessions' => 'integer',
            'treatment_log' => 'array',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
