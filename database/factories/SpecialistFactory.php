<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Specialist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Specialist>
 */
class SpecialistFactory extends Factory
{
    protected $model = Specialist::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // tenant_id lo autorrellena el trait BelongsToTenant desde TenantContext.
        return [
            'name' => fake()->name(),
            'specialty' => 'Odontología general',
            'active' => true,
        ];
    }
}
