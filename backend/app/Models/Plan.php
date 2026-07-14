<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Plan de suscripción del SaaS. Dato de referencia global (no tenant-scoped).
 * `max_patients` null = ilimitado.
 */
class Plan extends Model
{
    protected $fillable = [
        'key',
        'name',
        'max_patients',
        'price_mxn',
        'stripe_price_id',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'max_patients' => 'integer',
            'price_mxn' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class);
    }
}
