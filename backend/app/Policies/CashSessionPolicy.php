<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CashSession;
use App\Models\User;
use App\Support\Permissions;

class CashSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permissions::CASH_OPERATE)
            || $user->can(Permissions::REPORTS_VIEW);
    }

    public function view(User $user, CashSession $session): bool
    {
        return $this->viewAny($user);
    }

    public function operate(User $user): bool
    {
        return $user->can(Permissions::CASH_OPERATE);
    }

    public function close(User $user, CashSession $session): bool
    {
        // Caja global: cualquiera con cash.operate cierra la caja, sin importar
        // quién la abrió. Quien la cierre queda registrado en closed_by_user_id.
        return $user->can(Permissions::CASH_OPERATE);
    }
}
