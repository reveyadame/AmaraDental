<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Discount;
use App\Models\User;
use App\Support\Permissions;

class DiscountPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Discount $discount): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function update(User $user, Discount $discount): bool
    {
        return $user->can(Permissions::CATALOGS_MANAGE);
    }

    public function delete(User $user, Discount $discount): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
