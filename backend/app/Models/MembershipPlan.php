<?php

declare(strict_types=1);

namespace App\Models;

use App\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Auditable as AuditableTrait;
use OwenIt\Auditing\Contracts\Auditable;

class MembershipPlan extends Model implements Auditable
{
    /** @use HasFactory<\Database\Factories\MembershipPlanFactory> */
    use AuditableTrait, BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'annual_price',
        'valid_months',
        'default_discount_percent',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'annual_price' => 'decimal:2',
            'default_discount_percent' => 'decimal:2',
            'valid_months' => 'integer',
            'active' => 'boolean',
        ];
    }

    public function treatments(): BelongsToMany
    {
        return $this->belongsToMany(Treatment::class, 'membership_plan_treatments')
            ->withPivot(['discount_percent', 'annual_quota'])
            ->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }
}
