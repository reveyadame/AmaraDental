<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\ProvisionTenant as ProvisionTenantAction;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Alta atómica de una clínica (tenant) nueva: crea el tenant con branding
 * default, asegura el catálogo de roles, y crea su usuario administrador
 * inicial. Todo en una transacción — o se crea completo, o nada.
 *
 * Ejemplo:
 *   php artisan tenant:provision "Clínica Norte" \
 *     --slug=clinica-norte --admin-email=admin@clinicanorte.mx
 */
class ProvisionTenant extends Command
{
    protected $signature = 'tenant:provision
        {name : Nombre de la clínica}
        {--slug= : Slug único (subdominio). Por defecto se deriva del nombre}
        {--admin-email= : Email del administrador inicial (requerido)}
        {--admin-name=Administrador : Nombre del administrador}
        {--admin-password= : Contraseña del admin (si se omite, se genera una)}
        {--timezone=America/Mexico_City : Zona horaria de la clínica}';

    protected $description = 'Da de alta una clínica (tenant) nueva con su admin inicial';

    public function __construct(private readonly ProvisionTenantAction $provisioner)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $name = trim((string) $this->argument('name'));
        $slug = Str::slug((string) ($this->option('slug') ?: $name));
        $adminEmail = strtolower(trim((string) $this->option('admin-email')));
        $adminName = trim((string) $this->option('admin-name')) ?: 'Administrador';
        $timezone = (string) $this->option('timezone');

        // ── Validaciones ───────────────────────────────────────────────────
        if ($name === '') {
            $this->error('El nombre de la clínica es obligatorio.');

            return self::FAILURE;
        }
        if ($adminEmail === '' || ! filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            $this->error('Debes indicar un --admin-email válido.');

            return self::FAILURE;
        }
        $password = $this->option('admin-password') ? (string) $this->option('admin-password') : null;

        // ── Alta atómica (lógica compartida con el endpoint del super-admin) ─
        try {
            $result = $this->provisioner->handle(
                name: $name,
                slug: $slug,
                adminEmail: $adminEmail,
                adminName: $adminName,
                timezone: $timezone,
                password: $password,
            );
        } catch (\InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        /** @var Tenant $tenant */
        $tenant = $result['tenant'];

        // ── Resumen ────────────────────────────────────────────────────────
        $this->newLine();
        $this->info("✓ Clínica «{$tenant->name}» creada (id={$tenant->id}, slug={$tenant->slug}).");
        $this->line('  Admin inicial:');
        $this->line("    Email:    {$adminEmail}");
        if ($result['generated']) {
            $this->line("    Password: {$result['password']}   (generada — guárdala, no se vuelve a mostrar)");
        }
        $this->newLine();

        return self::SUCCESS;
    }
}
