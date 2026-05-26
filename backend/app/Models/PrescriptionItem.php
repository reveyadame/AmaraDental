<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class PrescriptionItem extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\PrescriptionItemFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'prescription_id',
        'medication',
        'presentation',
        'dosage',
        'route',
        'frequency',
        'duration',
        'instructions',
        'order_index',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }
}
