<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Actions\ProvisionTenant;
use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Administración de clínicas (tenants) desde el panel de plataforma.
 *
 * Opera sobre el modelo Tenant, que NO tiene scope de tenant → ve todas las
 * clínicas. Para datos por clínica (conteos) fija el TenantContext a esa
 * clínica y consulta normal, respetando el Global Scope (sin romperlo).
 */
class TenantsController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::query()->with('plan')->orderBy('name')->get();

        return response()->json([
            'data' => $tenants->map(fn (Tenant $t) => $this->summary($t))->values(),
        ]);
    }

    public function store(Request $request, ProvisionTenant $provisioner): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'email', 'max:255'],
            'admin_name' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'plan_key' => ['nullable', 'string', 'exists:plans,key'],
        ]);

        // Plan elegido (default: Esencial).
        $planId = Plan::query()->where('key', $data['plan_key'] ?? 'esencial')->value('id');

        try {
            $result = $provisioner->handle(
                name: trim($data['name']),
                slug: Str::slug($data['slug'] ?? $data['name']),
                adminEmail: $data['admin_email'],
                adminName: $data['admin_name'] ?? 'Administrador',
                timezone: $data['timezone'] ?? 'America/Mexico_City',
                planId: $planId,
            );
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['slug' => $e->getMessage()]);
        }

        return response()->json([
            'data' => $this->summary($result['tenant']),
            // La contraseña del admin se muestra UNA sola vez.
            'admin_password' => $result['password'],
        ], 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json(['data' => $this->summary($tenant, withCounts: true)]);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:active,suspended'],
            'name' => ['sometimes', 'string', 'max:255'],
            'plan_key' => ['sometimes', 'string', 'exists:plans,key'],
        ]);

        if (array_key_exists('plan_key', $data)) {
            $tenant->plan_id = Plan::query()->where('key', $data['plan_key'])->value('id');
            unset($data['plan_key']);
        }

        $tenant->fill($data)->save();

        return response()->json(['data' => $this->summary($tenant->refresh(), withCounts: true)]);
    }

    /** @return array<string, mixed> */
    private function summary(Tenant $tenant, bool $withCounts = false): array
    {
        $plan = $tenant->plan;

        $data = [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'brand_name' => $tenant->brand_name ?? $tenant->name,
            'status' => $tenant->status ?? Tenant::STATUS_ACTIVE,
            'plan' => $plan ? [
                'key' => $plan->key,
                'name' => $plan->name,
                'max_patients' => $plan->max_patients,
                'includes_app' => $plan->includes_app,
            ] : null,
            'created_at' => $tenant->created_at?->toIso8601String(),
        ];

        if ($withCounts) {
            $data['counts'] = $this->countsFor($tenant);
        }

        return $data;
    }

    /**
     * Conteos por clínica sin romper el Global Scope: fija temporalmente el
     * TenantContext a la clínica objetivo y restaura el previo.
     *
     * @return array{users: int, patients: int}
     */
    private function countsFor(Tenant $tenant): array
    {
        $previous = TenantContext::hasTenant() ? TenantContext::tenant() : null;
        TenantContext::setTenant($tenant);

        $counts = [
            'users' => User::query()->count(),
            'patients' => Patient::query()->count(),
        ];

        if ($previous !== null) {
            TenantContext::setTenant($previous);
        } else {
            TenantContext::clear();
        }

        return $counts;
    }
}
