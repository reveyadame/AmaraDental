<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Resources\AuditResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use OwenIt\Auditing\Models\Audit;

/**
 * Bitácora NOM-024: lista filtrable de cambios a las entidades del expediente
 * y del backoffice. Solo accesible para administradores.
 */
class AuditsController extends Controller implements HasMiddleware
{
    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): JsonResponse
    {
        $this->requireAdmin('Solo el administrador puede consultar la bitácora.');

        $audits = Audit::query()
            ->when($request->filled('user_id'),
                fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->when($request->filled('event'),
                fn ($q) => $q->where('event', $request->string('event')))
            ->when($request->filled('auditable_type'),
                fn ($q) => $q->where('auditable_type', $request->string('auditable_type')))
            ->when($request->filled('auditable_id'),
                fn ($q) => $q->where('auditable_id', $request->integer('auditable_id')))
            ->when($request->filled('date_from'),
                fn ($q) => $q->where('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'),
                fn ($q) => $q->where(
                    'created_at',
                    '<=',
                    $request->date('date_to')?->endOfDay(),
                ))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 50));

        // Hidratamos manualmente el usuario por id, ya que el morph user_type
        // del package no coincide siempre con relaciones eager-loadeables.
        $userIds = array_filter(array_map(fn ($a) => $a->user_id, $audits->items()));
        $users = User::query()->whereIn('id', $userIds)->get()->keyBy('id');
        $audits->getCollection()->each(function ($a) use ($users): void {
            if ($a->user_id && $users->has($a->user_id)) {
                $a->setRelation('user', $users->get($a->user_id));
            }
        });

        return response()->json([
            'data' => AuditResource::collection($audits->items()),
            'meta' => [
                'current_page' => $audits->currentPage(),
                'last_page' => $audits->lastPage(),
                'per_page' => $audits->perPage(),
                'total' => $audits->total(),
            ],
        ]);
    }

    /**
     * Catálogos para el formulario de filtros.
     */
    public function meta(Request $request): JsonResponse
    {
        $this->requireAdmin('Solo el administrador puede consultar la bitácora.');

        // Solo modelos que efectivamente tienen entradas en la bitácora.
        $types = Audit::query()
            ->select('auditable_type')
            ->distinct()
            ->orderBy('auditable_type')
            ->pluck('auditable_type')
            ->map(fn (string $fqn) => [
                'value' => $fqn,
                'label' => AuditResource::labelForType($fqn),
            ])
            ->values();

        $users = User::query()
            ->whereIn('id', Audit::query()->whereNotNull('user_id')->distinct()->pluck('user_id'))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name]);

        return response()->json([
            'data' => [
                'types' => $types,
                'users' => $users,
                'events' => ['created', 'updated', 'deleted', 'restored'],
            ],
        ]);
    }
}
