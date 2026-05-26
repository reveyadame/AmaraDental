<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\MembershipPlan;
use App\Models\User;
use App\Support\Permissions;

class MembershipPlanPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MembershipPlan $plan): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function update(User $user, MembershipPlan $plan): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function delete(User $user, MembershipPlan $plan): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
