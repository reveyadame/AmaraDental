<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Actions\DeleteTenant;
use App\Actions\ProvisionTenant;
use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Plan;
use App\Models\Tenant;
use App\Models\User;
use App\Support\BillingInfo;
use App\Support\TenantContext;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Administración de clínicas (tenants) desde el panel de plataforma.
 *
 * Opera sobre el modelo Tenant, que NO tiene scope de tenant → ve todas las
 * clínicas. Para datos por clínica (conteos, contacto) fija el TenantContext a
 * esa clínica y consulta normal, respetando el Global Scope (sin romperlo).
 *
 * `index` usa solo datos locales (rápido). El detalle (`show`) sí llama a Stripe
 * para traer la próxima renovación y el historial de facturas.
 */
class TenantsController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::query()->with('plan')->orderBy('name')->get();

        return response()->json([
            'data' => $tenants->map(fn (Tenant $t) => $this->summary($t, withDetails: true))->values(),
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
            'data' => $this->summary($result['tenant'], withDetails: true),
            // La contraseña del admin se muestra UNA sola vez.
            'admin_password' => $result['password'],
        ], 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        $data = $this->summary($tenant, withDetails: true);
        $data['billing'] = BillingInfo::for($tenant); // estado, renovación, facturas (Stripe)

        return response()->json(['data' => $data]);
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

        return response()->json(['data' => $this->summary($tenant->refresh(), withDetails: true)]);
    }

    /**
     * Elimina la clínica y TODOS sus datos. Irreversible. Para evitar borrados
     * accidentales, exige confirmar el slug exacto en el body.
     */
    public function destroy(Request $request, Tenant $tenant, DeleteTenant $deleter): JsonResponse
    {
        $request->validate(['confirm_slug' => ['required', 'string']]);

        if ($request->string('confirm_slug')->toString() !== $tenant->slug) {
            throw ValidationException::withMessages([
                'confirm_slug' => 'El identificador no coincide con el de la clínica.',
            ]);
        }

        $deleter->handle($tenant);

        return response()->json(['message' => 'Clínica eliminada permanentemente.']);
    }

    /** @return array<string, mixed> */
    private function summary(Tenant $tenant, bool $withDetails = false): array
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
                'price_mxn' => $plan->price_mxn,
            ] : null,
            'created_at' => $tenant->created_at?->toIso8601String(),
        ];

        if ($withDetails) {
            $ctx = $this->perTenant($tenant);
            $maxPatients = $plan?->max_patients;

            $data['counts'] = ['users' => $ctx['users'], 'patients' => $ctx['patients']];
            $data['usage'] = [
                'patients' => $ctx['patients'],
                'max_patients' => $maxPatients,
                'percent' => $maxPatients ? min(100, (int) round($ctx['patients'] / $maxPatients * 100)) : null,
            ];
            $data['contact'] = [
                'admin_name' => $ctx['admin_name'],
                'admin_email' => $ctx['admin_email'],
                'last_login_at' => $ctx['last_login_at'],
            ];
            $data['billing_lite'] = $this->billingLite($tenant);
        }

        return $data;
    }

    /**
     * Datos por clínica sin romper el Global Scope: fija temporalmente el
     * TenantContext a la clínica objetivo y restaura el previo.
     *
     * @return array{users:int,patients:int,admin_name:?string,admin_email:?string,last_login_at:?string}
     */
    private function perTenant(Tenant $tenant): array
    {
        $previous = TenantContext::hasTenant() ? TenantContext::tenant() : null;
        TenantContext::setTenant($tenant);

        // El admin provisionado es el usuario más antiguo de la clínica.
        $admin = User::query()->orderBy('id')->first();
        $lastLogin = User::query()->max('last_login_at');

        $result = [
            'users' => User::query()->count(),
            'patients' => Patient::query()->count(),
            'admin_name' => $admin?->name,
            'admin_email' => $admin?->email,
            'last_login_at' => $lastLogin ? Carbon::parse($lastLogin)->toIso8601String() : null,
        ];

        if ($previous !== null) {
            TenantContext::setTenant($previous);
        } else {
            TenantContext::clear();
        }

        return $result;
    }

    /**
     * Estado de cobro a partir de datos LOCALES (sin llamar a Stripe), para que
     * la lista sea rápida. La fecha de próxima renovación precisa va en `show`.
     *
     * @return array{state:string,trial_ends_at:?string}
     */
    private function billingLite(Tenant $tenant): array
    {
        $sub = $tenant->subscription('default');

        if ($tenant->subscribed('default') && $sub?->stripe_status !== 'past_due') {
            $state = 'active';
        } elseif ($sub?->stripe_status === 'past_due') {
            $state = 'past_due';
        } elseif ($tenant->onGenericTrial()) {
            $state = 'trial';
        } elseif ($sub !== null) {
            $state = 'canceled';
        } else {
            $state = 'none';
        }

        return [
            'state' => $state,
            'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
        ];
    }
}
