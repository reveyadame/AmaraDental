<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Requests\Specialists\StoreSpecialistRequest;
use App\Http\Requests\Specialists\UpdateSpecialistRequest;
use App\Http\Resources\SpecialistResource;
use App\Models\Specialist;
use App\Support\TenantContext;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * CRUD sobre el catálogo de especialistas. Los especialistas NO son usuarios
 * del sistema: no inician sesión.
 *
 * Lectura: cualquier usuario autenticado (necesaria para llenar selects en
 * agenda, recetas, cobros, etc).
 * Escritura: usuarios con permiso `catalogs.manage`.
 */
class SpecialistsController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $specialists = Specialist::query()
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('name', 'like', $term)
                      ->orWhere('specialty', 'like', $term)
                      ->orWhere('cedula_profesional', 'like', $term);
                });
            })
            ->when(
                $request->filled('active'),
                fn ($q) => $q->where('active', $request->boolean('active')),
            )
            ->orderBy('name')
            ->get();

        return SpecialistResource::collection($specialists);
    }

    public function store(StoreSpecialistRequest $request): JsonResponse
    {
        $data = $request->validated();
        $specialist = Specialist::query()->create(array_merge(
            ['tenant_id' => TenantContext::tenantId(), 'active' => true],
            $data,
        ));

        return response()->json(['data' => SpecialistResource::make($specialist)], 201);
    }

    public function show(Specialist $specialist): JsonResponse
    {
        return response()->json(['data' => SpecialistResource::make($specialist)]);
    }

    public function update(UpdateSpecialistRequest $request, Specialist $specialist): JsonResponse
    {
        $specialist->update($request->validated());

        return response()->json(['data' => SpecialistResource::make($specialist)]);
    }

    public function destroy(Specialist $specialist): JsonResponse
    {
        abort_unless(request()->user()?->hasRole(Role::Admin->value), 403);

        // Soft semántico: marca inactivo. La eliminación real bloquearía por
        // restrictOnDelete en commission_payments si tuviera historial.
        $specialist->update(['active' => false]);

        return response()->json(['message' => 'OK']);
    }
}
