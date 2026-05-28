<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class DentalTreatmentLog extends Model implements Auditable
{
    use AuditableTrait, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'patient_id',
        'tooth_number',
        'treatment_id',
        'performed_on',
        'description',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'performed_on' => 'date',
            'tooth_number' => 'integer',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
