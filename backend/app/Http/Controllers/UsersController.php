<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UsersController extends Controller implements HasMiddleware
{
    use AuthorizesRequests;

    /** @return array<int, Middleware|string> */
    public static function middleware(): array
    {
        return ['auth:sanctum'];
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->when($request->string('q')->isNotEmpty(), function ($q) use ($request): void {
                $term = '%'.$request->string('q').'%';
                $q->where(function ($q) use ($term): void {
                    $q->where('name', 'like', $term)->orWhere('email', 'like', $term);
                });
            })
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 25));

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        // `permissions` se descarta por compatibilidad con clientes legacy:
        // el modelo es puramente basado en roles.
        $data = $request->safe()->except(['roles', 'permissions']);
        $user = User::query()->create($data);

        $user->syncRoles($request->safe()->array('roles'));

        return response()->json(['data' => UserResource::make($user)], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json(['data' => UserResource::make($user)]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $user->update($request->safe()->except(['roles', 'permissions']));

        if ($request->has('roles')) {
            $user->syncRoles($request->safe()->array('roles'));
        }

        return response()->json(['data' => UserResource::make($user)]);
    }

    public function destroy(User $user, Request $request): JsonResponse
    {
        $this->authorize('delete', $user);
        // Gate::before deja pasar al admin para cualquier ability; el self-delete
        // se bloquea explícitamente aquí.
        abort_if(
            $user->id === $request->user()?->id,
            422,
            'No puedes eliminar tu propio usuario.',
        );

        $user->delete();

        return response()->json(['message' => 'OK']);
    }
}
