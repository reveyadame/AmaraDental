<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\CashExpense;
use App\Models\User;
use App\Support\Permissions;

class CashExpensePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::CASH_OPERATE)
            || $user->can(Permissions::REPORTS_VIEW);
    }

    public function view(User $user, CashExpense $expense): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::CASH_OPERATE);
    }

    public function delete(User $user, CashExpense $expense): bool
    {
        return $user->hasRole(Role::Admin->value);
    }
}
