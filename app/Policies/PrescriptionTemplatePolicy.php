<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\PrescriptionTemplate;
use App\Models\User;
use App\Support\Permissions;

class PrescriptionTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::PRESCRIPTIONS_CREATE)
            || $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function view(User $user, PrescriptionTemplate $template): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::PRESCRIPTIONS_CREATE)
            || $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function update(User $user, PrescriptionTemplate $template): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, PrescriptionTemplate $template): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
