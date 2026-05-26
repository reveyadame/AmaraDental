<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;
use App\Support\Permissions;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::USERS_MANAGE);
    }

    public function view(User $user, User $target): bool
    {
        return $user->can(Permissions::USERS_MANAGE) || $user->id === $target->id;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::USERS_MANAGE);
    }

    public function update(User $user, User $target): bool
    {
        return $user->can(Permissions::USERS_MANAGE) || $user->id === $target->id;
    }

    public function delete(User $user, User $target): bool
    {
        return $user->hasRole(Role::Admin->value) && $user->id !== $target->id;
    }
}
