<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PlatformAdmin;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Crea un administrador de plataforma (super-admin del SaaS). Identidad
 * aislada de los usuarios de clínica.
 *
 *   php artisan platform:create-admin "Tu Nombre" --email=tu@amaradental.mx
 */
class CreatePlatformAdmin extends Command
{
    protected $signature = 'platform:create-admin
        {name : Nombre del administrador}
        {--email= : Email (requerido)}
        {--password= : Contraseña (si se omite, se genera una)}';

    protected $description = 'Crea un administrador de plataforma (super-admin del SaaS)';

    public function handle(): int
    {
        $name = trim((string) $this->argument('name'));
        $email = strtolower(trim((string) $this->option('email')));

        if ($name === '') {
            $this->error('El nombre es obligatorio.');

            return self::FAILURE;
        }
        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Debes indicar un --email válido.');

            return self::FAILURE;
        }
        if (PlatformAdmin::query()->where('email', $email)->exists()) {
            $this->error("Ya existe un administrador de plataforma con «{$email}».");

            return self::FAILURE;
        }

        $generated = ! $this->option('password');
        $password = $generated ? Str::password(16) : (string) $this->option('password');

        // El cast 'hashed' del modelo hashea la contraseña al asignarla.
        $admin = PlatformAdmin::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'active' => true,
        ]);

        $this->newLine();
        $this->info("✓ Super-admin creado: {$admin->email}");
        if ($generated) {
            $this->line("  Password: {$password}   (generada — guárdala, no se vuelve a mostrar)");
        }
        $this->newLine();

        return self::SUCCESS;
    }
}
