<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Prescription;
use App\Models\User;
use App\Support\Permissions;

class PrescriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::CLINICAL_VIEW)
            || $user->can(Permissions::PRESCRIPTIONS_CREATE);
    }

    public function view(User $user, Prescription $prescription): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::PRESCRIPTIONS_CREATE);
    }

    public function delete(User $user, Prescription $prescription): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
