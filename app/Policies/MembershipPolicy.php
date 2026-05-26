<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Membership;
use App\Models\User;
use App\Support\Permissions;

class MembershipPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Membership $membership): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::MEMBERSHIPS_MANAGE);
    }

    public function update(User $user, Membership $membership): bool
    {
        return $user->can(Permissions::MEMBERSHIPS_MANAGE);
    }

    public function delete(User $user, Membership $membership): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
