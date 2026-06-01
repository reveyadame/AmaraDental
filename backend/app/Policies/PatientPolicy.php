<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Patient;
use App\Models\User;
use App\Support\Permissions;

/**
 * Pacientes — datos administrativos (contacto, identificación, etc).
 *
 * Expediente clínico (historia, odontograma, recetas, consentimientos) usa
 * `viewClinical` / `updateClinical` y requiere permisos `clinical.*`.
 */
class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->viewBasic($user, new Patient());
    }

    public function view(User $user, Patient $patient): bool
    {
        return $this->viewBasic($user, $patient);
    }

    /**
     * Lectura de identificación + contacto + saldo. Roles operativos (Caja,
     * Agenda, Membresías, Labs, Recalls) la tienen además del rol Pacientes.
     * NO da acceso al expediente clínico — eso pasa por `viewClinical`.
     */
    public function viewBasic(User $user, Patient $patient): bool
    {
        return $user->can(Permissions::PATIENTS_READ_BASIC)
            || $user->can(Permissions::PATIENTS_MANAGE)
            || $user->can(Permissions::CLINICAL_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->can(Permissions::PATIENTS_MANAGE);
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->can(Permissions::PATIENTS_MANAGE);
    }

    public function delete(User $user, Patient $patient): bool
    {
        // Regla general: solo Administrador puede eliminar pacientes.
        if ($user->hasRole(Role::Admin->value)) {
            return true;
        }

        // Excepción: pacientes capturados como "primera vez" desde la agenda
        // pueden eliminarse por quienes operan citas, cuando confirman que
        // el paciente no se presentó — sirve para limpiar capturas que ya
        // no van a usarse, sin requerir que un admin lo haga.
        if ($patient->is_first_visit && $user->can(Permissions::APPOINTMENTS_MANAGE)) {
            return true;
        }

        return false;
    }

    public function viewClinical(User $user, Patient $patient): bool
    {
        return $user->can(Permissions::CLINICAL_VIEW);
    }

    public function updateClinical(User $user, Patient $patient): bool
    {
        return $user->can(Permissions::CLINICAL_MANAGE);
    }
}
