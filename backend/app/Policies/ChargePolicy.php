<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Charge;
use App\Models\User;
use App\Support\Permissions;

class ChargePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::CHARGES_CREATE)
            || $user->can(Permissions::CASH_OPERATE)
            || $user->can(Permissions::REPORTS_VIEW);
    }

    public function view(User $user, Charge $charge): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::CHARGES_CREATE);
    }

    public function cancel(User $user, Charge $charge): bool
    {
        return $user->can(Permissions::CHARGES_CANCEL);
    }
}
