<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\CommissionPayment;
use App\Models\User;
use App\Support\Permissions;

/**
 * Los especialistas ya no son usuarios — la noción de "ver solo los míos"
 * desaparece. Pagos de comisión los administra cualquier usuario con permiso
 * `commissions.manage`.
 */
class CommissionPaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::COMMISSIONS_MANAGE)
            || $user->can(Permissions::REPORTS_VIEW);
    }

    public function view(User $user, CommissionPayment $payment): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::COMMISSIONS_MANAGE);
    }

    public function delete(User $user, CommissionPayment $payment): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
