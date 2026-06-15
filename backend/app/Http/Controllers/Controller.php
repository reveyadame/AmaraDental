<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;

abstract class Controller
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Puerta admin-only reutilizable. Centraliza en un solo lugar la regla
     * "esta acción requiere administrador", para que no se reescriba (ni se
     * pueda divergir) por cada controlador. Aborta 403 si el usuario actual
     * no tiene el rol admin.
     *
     * @param  string|null  $message  mensaje 403 opcional (default genérico).
     */
    protected function requireAdmin(?string $message = null): void
    {
        abort_unless(
            auth()->user()?->hasRole(Role::Admin->value),
            403,
            $message ?? 'Esta acción requiere permisos de administrador.',
        );
    }
}
