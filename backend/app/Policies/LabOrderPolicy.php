<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\LabOrder;
use App\Models\User;
use App\Support\Permissions;

class LabOrderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LabOrder $order): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::LABS_MANAGE);
    }

    public function update(User $user, LabOrder $order): bool
    {
        return $user->can(Permissions::LABS_MANAGE);
    }

    public function delete(User $user, LabOrder $order): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
