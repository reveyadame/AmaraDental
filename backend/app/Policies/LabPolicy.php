<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Lab;
use App\Models\User;
use App\Support\Permissions;

class LabPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Lab $lab): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function update(User $user, Lab $lab): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function delete(User $user, Lab $lab): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
