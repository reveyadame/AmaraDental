<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Patient;
use Illuminate\Database\Seeder;

class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            [
                'first_name' => 'María',
                'last_name' => 'González López',
                'date_of_birth' => '1992-03-14',
                'gender' => 'F',
                'email' => 'maria@example.mx',
                'mobile_phone' => '5544332211',
                'city' => 'Ciudad de México',
                'state' => 'CDMX',
                'occupation' => 'Diseñadora',
                'referred_by' => 'Recomendación',
            ],
            [
                'first_name' => 'José',
                'last_name' => 'Ramírez Cruz',
                'date_of_birth' => '1985-08-21',
                'gender' => 'M',
                'email' => 'jose.ramirez@example.mx',
                'mobile_phone' => '5599887766',
                'city' => 'Monterrey',
                'state' => 'NL',
                'occupation' => 'Contador',
            ],
            [
                'first_name' => 'Sofía',
                'last_name' => 'Hernández Ortiz',
                'date_of_birth' => '2014-11-02',
                'gender' => 'F',
                'mobile_phone' => '5511223344',
                'emergency_contact_name' => 'Laura Hernández',
                'emergency_contact_phone' => '5511223345',
                'city' => 'Guadalajara',
                'state' => 'JAL',
            ],
        ];

        foreach ($patients as $p) {
            Patient::query()->updateOrCreate(
                ['tenant_id' => 1, 'first_name' => $p['first_name'], 'last_name' => $p['last_name']],
                $p + ['tenant_id' => 1, 'active' => true],
            );
        }
    }
}
