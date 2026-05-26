<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Role as RoleEnum;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['tenant_id' => 1, 'email' => 'admin@ciodent.local'],
            [
                'name' => 'Administrador Demo',
                'password' => Hash::make('password'),
                'active' => true,
            ],
        );
        if (! $admin->hasRole(RoleEnum::Admin->value)) {
            $admin->assignRole(RoleEnum::Admin->value);
        }

        // Operador de caja (demo).
        $caja = User::query()->updateOrCreate(
            ['tenant_id' => 1, 'email' => 'caja@ciodent.local'],
            [
                'name' => 'Carla Pérez',
                'password' => Hash::make('password'),
                'active' => true,
            ],
        );
        if (! $caja->hasRole(RoleEnum::Cash->value)) {
            $caja->assignRole(RoleEnum::Cash->value);
        }
    }
}
