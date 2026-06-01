<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Quote;
use App\Models\User;
use App\Support\Permissions;

class QuotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::QUOTES_MANAGE)
            || $user->can(Permissions::CHARGES_CREATE)
            || $user->can(Permissions::REPORTS_VIEW);
    }

    public function view(User $user, Quote $quote): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::QUOTES_MANAGE);
    }

    public function update(User $user, Quote $quote): bool
    {
        return $user->can(Permissions::QUOTES_MANAGE) && $quote->isEditable();
    }

    /**
     * Convertir a cobro requiere también permiso de crear cobros — para que
     * el rol que solo prepare presupuestos no pueda generar movimientos en
     * caja por sí solo.
     */
    public function convert(User $user, Quote $quote): bool
    {
        return $user->can(Permissions::QUOTES_MANAGE)
            && $user->can(Permissions::CHARGES_CREATE)
            && $quote->status !== 'converted';
    }

    /**
     * Eliminar es solo admin (mismo criterio que las otras acciones
     * destructivas del sistema).
     */
    public function delete(User $user, Quote $quote): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
