<?php

declare(strict_types=1);

namespace App\Concerns;

use App\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Scope;

/**
 * Trait base para todo modelo de negocio multi-tenant.
 *
 * - Aplica un Global Scope que filtra por el tenant_id resuelto en
 *   el middleware ResolveTenant.
 * - Rellena automáticamente `tenant_id` en `creating`, usando el
 *   tenant del contexto si no se proveyó explícitamente.
 *
 * Reglas:
 *   - Cualquier query debe pasar por Eloquent (no DB::table crudo)
 *     para que este scope aplique.
 *   - Para tareas administrativas que necesiten cruzar tenants,
 *     usar `Model::query()->withoutGlobalScope(TenantScope::class)`.
 */
trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model): void {
            if (! $model->tenant_id && TenantContext::hasTenant()) {
                $model->tenant_id = TenantContext::tenantId();
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

class TenantScope implements Scope
{
    public function apply(Builder $builder, $model): void
    {
        if (TenantContext::hasTenant()) {
            $builder->where($model->getTable().'.tenant_id', TenantContext::tenantId());
        }
    }
}
