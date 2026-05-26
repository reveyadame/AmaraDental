<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Discount;
use Illuminate\Database\Seeder;

class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Descuento estudiante', 'type' => 'percent', 'value' => 10, 'scope' => 'global'],
            ['name' => 'Promoción primera consulta', 'type' => 'amount', 'value' => 200, 'scope' => 'global'],
        ];

        foreach ($items as $i) {
            Discount::query()->updateOrCreate(
                ['tenant_id' => 1, 'name' => $i['name']],
                $i + ['tenant_id' => 1, 'active' => true],
            );
        }
    }
}
