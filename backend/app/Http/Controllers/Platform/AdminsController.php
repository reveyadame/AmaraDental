<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAdmin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Gestión de super-admins (PlatformAdmin) desde el panel. Todos los admins son
 * iguales (sin niveles), con salvaguardas para no dejar el sistema sin acceso:
 *   - nadie puede eliminarse o desactivarse a sí mismo,
 *   - no se puede eliminar/desactivar al último admin activo.
 */
class AdminsController extends Controller
{
    public function index(): JsonResponse
    {
        $admins = PlatformAdmin::query()->orderBy('name')->get();

        return response()->json([
            'data' => $admins->map(fn (PlatformAdmin $a) => $this->serialize($a))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('platform_admins', 'email')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $admin = PlatformAdmin::query()->create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => $data['password'], // cast 'hashed' lo hashea
            'active' => $data['active'] ?? true,
        ]);

        return response()->json(['data' => $this->serialize($admin)], 201);
    }

    public function update(Request $request, PlatformAdmin $admin): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('platform_admins', 'email')->ignore($admin->id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:255'],
            'active' => ['sometimes', 'boolean'],
        ]);

        // No te puedes desactivar a ti mismo, ni dejar cero admins activos.
        if (array_key_exists('active', $data) && ! $data['active']) {
            if ($admin->is($request->user())) {
                throw ValidationException::withMessages(['active' => 'No puedes desactivar tu propia cuenta.']);
            }
            if ($this->isLastActiveAdmin($admin)) {
                throw ValidationException::withMessages(['active' => 'Debe quedar al menos un administrador activo.']);
            }
        }

        if (array_key_exists('email', $data)) {
            $data['email'] = strtolower($data['email']);
        }

        // password vacío/omitido → no se toca.
        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $admin->fill($data)->save();

        return response()->json(['data' => $this->serialize($admin->refresh())]);
    }

    public function destroy(Request $request, PlatformAdmin $admin): JsonResponse
    {
        if ($admin->is($request->user())) {
            throw ValidationException::withMessages(['admin' => 'No puedes eliminar tu propia cuenta.']);
        }

        if ($this->isLastActiveAdmin($admin)) {
            throw ValidationException::withMessages(['admin' => 'Debe quedar al menos un administrador activo.']);
        }

        $admin->tokens()->delete(); // revoca sus sesiones
        $admin->delete();

        return response()->json(['message' => 'Administrador eliminado.']);
    }

    private function isLastActiveAdmin(PlatformAdmin $admin): bool
    {
        if (! $admin->active) {
            return false;
        }

        return PlatformAdmin::query()->where('active', true)->where('id', '!=', $admin->id)->doesntExist();
    }

    /** @return array<string, mixed> */
    private function serialize(PlatformAdmin $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'active' => (bool) $admin->active,
            'last_login_at' => $admin->last_login_at?->toIso8601String(),
            'created_at' => $admin->created_at?->toIso8601String(),
        ];
    }
}
