<?php

declare(strict_types=1);

namespace App\Http\Controllers\Public;

use App\Actions\ProvisionTenant;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Alta self-service desde la landing pública (apex amaradental.mx). Sin auth y
 * sin tenant: crea la clínica con 14 días de prueba (vía ProvisionTenant) y le
 * envía las credenciales por correo. La tarjeta se agrega después desde dentro.
 */
class SignupController extends Controller
{
    private const SLUG_MIN = 3;
    private const SLUG_MAX = 40;

    /** Catálogo público de planes para la sección de precios de la landing. */
    public function plans(): JsonResponse
    {
        $plans = Plan::query()->orderBy('sort_order')->get();

        return response()->json([
            'data' => $plans->map(fn (Plan $p) => [
                'key' => $p->key,
                'name' => $p->name,
                'max_patients' => $p->max_patients,
                'includes_app' => $p->includes_app,
                'price_mxn' => $p->price_mxn,
            ])->values(),
        ]);
    }

    /** Verifica disponibilidad de un subdominio en vivo (mientras el usuario teclea). */
    public function checkSlug(Request $request): JsonResponse
    {
        $slug = Str::slug((string) $request->query('slug', ''));
        [$available, $reason] = $this->slugStatus($slug);

        return response()->json(['slug' => $slug, 'available' => $available, 'reason' => $reason]);
    }

    public function store(Request $request, ProvisionTenant $provisioner): JsonResponse
    {
        $data = $request->validate([
            'clinic_name' => ['required', 'string', 'max:255'],
            'admin_name' => ['nullable', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'email', 'max:255'],
            'slug' => ['required', 'string', 'max:'.self::SLUG_MAX],
            'plan_key' => ['nullable', 'string', 'exists:plans,key'],
        ]);

        $slug = Str::slug($data['slug']);
        [$available, $reason] = $this->slugStatus($slug);
        if (! $available) {
            throw ValidationException::withMessages(['slug' => $reason]);
        }

        $planId = Plan::query()->where('key', $data['plan_key'] ?? 'esencial')->value('id');

        try {
            $result = $provisioner->handle(
                name: trim($data['clinic_name']),
                slug: $slug,
                adminEmail: $data['admin_email'],
                adminName: $data['admin_name'] ?: 'Administrador',
                planId: $planId,
            );
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['slug' => $e->getMessage()]);
        }

        $tenant = $result['tenant'];

        // No devolvemos la contraseña en una respuesta pública: va por correo.
        return response()->json([
            'data' => [
                'slug' => $tenant->slug,
                'app_url' => $tenant->appUrl(),
                'admin_email' => $data['admin_email'],
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
            ],
        ], 201);
    }

    /**
     * @return array{0:bool,1:?string} [disponible, motivo]
     */
    private function slugStatus(string $slug): array
    {
        if (strlen($slug) < self::SLUG_MIN) {
            return [false, 'Debe tener al menos '.self::SLUG_MIN.' caracteres.'];
        }
        if (strlen($slug) > self::SLUG_MAX) {
            return [false, 'Es demasiado largo.'];
        }
        if (in_array($slug, (array) config('tenancy.reserved_subdomains', []), true)) {
            return [false, 'Ese subdominio está reservado.'];
        }
        if (Tenant::query()->where('slug', $slug)->exists()) {
            return [false, 'Ese subdominio ya está en uso.'];
        }

        return [true, null];
    }
}
