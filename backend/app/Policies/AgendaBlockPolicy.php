<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\AgendaBlock;
use App\Models\User;
use App\Support\Permissions;

class AgendaBlockPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AgendaBlock $block): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::AGENDA_BLOCKS_MANAGE);
    }

    public function update(User $user, AgendaBlock $block): bool
    {
        return $user->can(Permissions::AGENDA_BLOCKS_MANAGE);
    }

    public function delete(User $user, AgendaBlock $block): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
