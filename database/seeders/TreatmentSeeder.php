<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Treatment;
use Illuminate\Database\Seeder;

class TreatmentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['code' => 'CONS', 'name' => 'Consulta y diagnóstico', 'category' => 'Diagnóstico', 'base_price' => 350, 'duration_minutes' => 30, 'commission_percent' => 30],
            ['code' => 'LIMP', 'name' => 'Limpieza dental', 'category' => 'Preventivo', 'base_price' => 800, 'duration_minutes' => 45, 'commission_percent' => 35, 'periodicity_days' => 180, 'recall_label' => 'Limpieza semestral'],
            ['code' => 'BLAN', 'name' => 'Blanqueamiento (sesión)', 'category' => 'Estética', 'base_price' => 2500, 'duration_minutes' => 60, 'commission_percent' => 40],
            ['code' => 'OBT-1', 'name' => 'Resina simple (1 cara)', 'category' => 'Restaurador', 'base_price' => 700, 'duration_minutes' => 40, 'commission_percent' => 35],
            ['code' => 'OBT-2', 'name' => 'Resina compuesta (2-3 caras)', 'category' => 'Restaurador', 'base_price' => 1100, 'duration_minutes' => 60, 'commission_percent' => 35],
            ['code' => 'ENDO-U', 'name' => 'Endodoncia unirradicular', 'category' => 'Endodoncia', 'base_price' => 2800, 'duration_minutes' => 90, 'commission_percent' => 40],
            ['code' => 'ENDO-M', 'name' => 'Endodoncia multirradicular', 'category' => 'Endodoncia', 'base_price' => 4500, 'duration_minutes' => 120, 'commission_percent' => 40],
            ['code' => 'EXT-S', 'name' => 'Extracción simple', 'category' => 'Cirugía', 'base_price' => 700, 'duration_minutes' => 30, 'commission_percent' => 35],
            ['code' => 'EXT-Q', 'name' => 'Extracción quirúrgica / muelas del juicio', 'category' => 'Cirugía', 'base_price' => 2500, 'duration_minutes' => 60, 'commission_percent' => 40],
            ['code' => 'CORON', 'name' => 'Corona de porcelana', 'category' => 'Prostodoncia', 'base_price' => 5500, 'duration_minutes' => 60, 'commission_percent' => 35],
            ['code' => 'ORTO-M', 'name' => 'Ortodoncia (mensualidad)', 'category' => 'Ortodoncia', 'base_price' => 950, 'duration_minutes' => 30, 'commission_percent' => 30, 'periodicity_days' => 30, 'recall_label' => 'Ajuste mensual de ortodoncia'],
        ];

        foreach ($items as $i) {
            Treatment::query()->updateOrCreate(
                ['tenant_id' => 1, 'code' => $i['code']],
                $i + ['tenant_id' => 1, 'active' => true],
            );
        }
    }
}
