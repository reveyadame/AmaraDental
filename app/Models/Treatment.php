<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class Treatment extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\TreatmentFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'category',
        'description',
        'base_price',
        'duration_minutes',
        'commission_percent',
        'commission_base',
        'cost',
        'periodicity_days',
        'recall_label',
        'requires_consent_template_id',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'commission_percent' => 'decimal:2',
            'cost' => 'decimal:2',
            'duration_minutes' => 'integer',
            'periodicity_days' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function consentTemplate(): BelongsTo
    {
        return $this->belongsTo(ConsentTemplate::class, 'requires_consent_template_id');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(Discount::class);
    }
}
