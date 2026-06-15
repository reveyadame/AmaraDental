<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Treatment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Treatment>
 */
class TreatmentFactory extends Factory
{
    protected $model = Treatment::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // tenant_id lo autorrellena el trait BelongsToTenant desde TenantContext.
        return [
            'name' => fake()->words(2, true),
            'base_price' => fake()->numberBetween(100, 5000),
            'commission_percent' => null,   // sin comisión por defecto (simplifica los tests)
            'commission_base' => 'price',
            'cost' => 0,
            'active' => true,
        ];
    }
}
