<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // tenant_id lo autorrellena el trait BelongsToTenant desde TenantContext.
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'date_of_birth' => fake()->date(),
            'gender' => fake()->randomElement(['M', 'F', 'Otro']),
            'active' => true,
        ];
    }
}
