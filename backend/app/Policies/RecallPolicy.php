<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Recall;
use App\Models\User;
use App\Support\Permissions;

class RecallPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Recall $recall): bool
    {
        return true;
    }

    public function update(User $user, Recall $recall): bool
    {
        return $user->can(Permissions::RECALLS_MANAGE);
    }

    public function delete(User $user, Recall $recall): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
