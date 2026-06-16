<?php

declare(strict_types=1);

namespace App\Actions;

use App\Mail\ClinicCredentialsResetMail;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Regenera la contraseña del admin de una clínica (el usuario más antiguo, que
 * es el provisionado al crearla) y se la reenvía por correo. Devuelve la nueva
 * contraseña para mostrarla UNA vez en el panel.
 *
 * @return array{email:string,password:string,sent:bool}
 */
class ResetTenantAdminPassword
{
    /** @return array{email:string,password:string,sent:bool} */
    public function handle(Tenant $tenant): array
    {
        $password = Str::password(16);

        // Fija el contexto a la clínica para resolver su admin sin romper scope.
        $previous = TenantContext::hasTenant() ? TenantContext::tenant() : null;
        TenantContext::setTenant($tenant);

        try {
            $admin = User::query()->orderBy('id')->first();

            if ($admin === null) {
                throw new RuntimeException('La clínica no tiene un usuario administrador.');
            }

            // saveQuietly: el cambio de contraseña no debe disparar auditoría.
            $admin->forceFill(['password' => Hash::make($password)])->saveQuietly();
            $email = $admin->email;
        } finally {
            if ($previous !== null) {
                TenantContext::setTenant($previous);
            } else {
                TenantContext::clear();
            }
        }

        // Reenvío del correo (no revierte el cambio si el correo falla).
        $sent = true;
        try {
            Mail::to($email)->send(new ClinicCredentialsResetMail(
                tenant: $tenant,
                adminEmail: $email,
                password: $password,
                loginUrl: $tenant->appUrl(),
            ));
        } catch (Throwable $e) {
            $sent = false;
            Log::warning('No se pudo enviar el correo de nueva contraseña.', [
                'tenant_id' => $tenant->id,
                'error' => $e->getMessage(),
            ]);
        }

        return ['email' => $email, 'password' => $password, 'sent' => $sent];
    }
}
