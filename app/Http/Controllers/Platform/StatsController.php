<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Métricas agregadas cross-tenant para el dashboard del panel de plataforma.
 *
 * Opera por encima de los tenants: los conteos globales de pacientes/usuarios
 * se hacen SIN el Global Scope (withoutGlobalScopes), porque aquí justamente
 * queremos el total de todas las clínicas. El modelo Tenant no es tenant-scoped.
 */
class StatsController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::query()->with('plan')->get();

        return response()->json([
            'data' => [
                'totals' => $this->totals($tenants),
                'by_plan' => $this->byPlan($tenants),
                'by_subscription' => $this->bySubscription($tenants),
                'growth' => $this->growth($tenants),
            ],
        ]);
    }

    /** @param \Illuminate\Support\Collection<int,Tenant> $tenants */
    private function totals($tenants): array
    {
        return [
            'tenants' => $tenants->count(),
            'active' => $tenants->filter->isActive()->count(),
            'suspended' => $tenants->reject->isActive()->count(),
            // Cross-tenant: todas las clínicas. Sin Global Scope a propósito.
            'patients' => Patient::query()->withoutGlobalScopes()->count(),
            'users' => User::query()->withoutGlobalScopes()->count(),
        ];
    }

    /**
     * Distribución de clínicas por plan (incluye los planes sin clínicas, en 0,
     * y un bucket "Sin plan" para grandfathered).
     *
     * @param \Illuminate\Support\Collection<int,Tenant> $tenants
     */
    private function byPlan($tenants): array
    {
        $counts = $tenants->countBy(fn (Tenant $t) => $t->plan?->key ?? '_none');

        $rows = Plan::query()->orderBy('sort_order')->get()->map(fn (Plan $p) => [
            'key' => $p->key,
            'name' => $p->name,
            'count' => (int) ($counts[$p->key] ?? 0),
        ])->values()->all();

        if (($counts['_none'] ?? 0) > 0) {
            $rows[] = ['key' => '_none', 'name' => 'Sin plan', 'count' => (int) $counts['_none']];
        }

        return $rows;
    }

    /**
     * Conteo de clínicas por estado de cobro. Usa los helpers de Cashier del
     * Tenant (no toca tablas directamente).
     *
     * @param \Illuminate\Support\Collection<int,Tenant> $tenants
     */
    private function bySubscription($tenants): array
    {
        $buckets = ['active' => 0, 'trial' => 0, 'past_due' => 0, 'canceled' => 0, 'none' => 0];

        foreach ($tenants as $tenant) {
            $sub = $tenant->subscription('default');

            if ($tenant->subscribed('default') && ($sub?->stripe_status !== 'past_due')) {
                $buckets['active']++;
            } elseif ($sub?->stripe_status === 'past_due') {
                $buckets['past_due']++;
            } elseif ($tenant->onGenericTrial()) {
                $buckets['trial']++;
            } elseif ($sub !== null) {
                // Tuvo suscripción pero ya no está activa.
                $buckets['canceled']++;
            } else {
                $buckets['none']++;
            }
        }

        return $buckets;
    }

    /**
     * Altas de clínicas por mes (últimos 12 meses) + total acumulado al cierre
     * de cada mes. Se calcula en PHP para evitar diferencias de SQL por motor.
     *
     * @param \Illuminate\Support\Collection<int,Tenant> $tenants
     * @return array<int,array{month:string,label:string,new:int,total:int}>
     */
    private function growth($tenants): array
    {
        $created = $tenants->map(fn (Tenant $t) => $t->created_at)->filter()->sort()->values();

        $months = [];
        $cursor = now()->startOfMonth()->subMonths(11);
        $labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        for ($i = 0; $i < 12; $i++) {
            $monthStart = $cursor->copy();
            $monthEnd = $cursor->copy()->endOfMonth();

            $new = $created->filter(fn ($d) => $d->between($monthStart, $monthEnd))->count();
            $total = $created->filter(fn ($d) => $d->lessThanOrEqualTo($monthEnd))->count();

            $months[] = [
                'month' => $monthStart->format('Y-m'),
                'label' => $labels[$monthStart->month - 1].' '.$monthStart->format('y'),
                'new' => $new,
                'total' => $total,
            ];

            $cursor->addMonth();
        }

        return $months;
    }
}
