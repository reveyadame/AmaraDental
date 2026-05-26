<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Appointment;
use App\Models\User;
use App\Support\Permissions;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        // Cualquier usuario autenticado puede ver la agenda — gating fino se
        // hace por permisos de gestión.
        return true;
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::APPOINTMENTS_MANAGE);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $user->can(Permissions::APPOINTMENTS_MANAGE);
    }

    public function changeStatus(User $user, Appointment $appointment): bool
    {
        return $this->update($user, $appointment);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
