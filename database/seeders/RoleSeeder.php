<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Cataloga permisos.
        foreach (Permissions::all() as $name) {
            Permission::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
            );
        }

        // 2. Crea roles y sincroniza permisos según la matriz.
        $matrix = Permissions::roleMatrix();
        foreach (RoleEnum::cases() as $role) {
            $r = Role::query()->updateOrCreate(
                ['name' => $role->value, 'guard_name' => 'web'],
            );
            $perms = $matrix[$role->value] ?? [];
            $r->syncPermissions($perms);
        }

        // 3. Elimina roles y permisos legacy que ya no aplican.
        $validRoles = array_map(fn (RoleEnum $r) => $r->value, RoleEnum::cases());
        Role::query()
            ->whereNotIn('name', $validRoles)
            ->where('guard_name', 'web')
            ->delete();

        Permission::query()
            ->whereNotIn('name', Permissions::all())
            ->where('guard_name', 'web')
            ->delete();

        // 4. Purga permisos directos en usuarios. El sistema es puramente
        //    basado en roles — no debe haber asignaciones individuales.
        DB::table('model_has_permissions')->delete();

        // 5. Limpia el cache de Spatie.
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
