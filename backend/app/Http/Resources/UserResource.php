<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'active' => $this->active,
            'roles' => $this->getRoleNames()->all(),
            // Permisos efectivos del usuario — vienen únicamente de los roles
            // asignados. No exponemos permisos directos porque el sistema ya
            // no los soporta.
            'permissions' => $this->getAllPermissions()->pluck('name')->all(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
